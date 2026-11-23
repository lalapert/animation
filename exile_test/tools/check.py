"""Final checks on exile_test.mp4 (after vm13-rewards-program/tools/check.py). Exit 1 if any fails. -> out/final_check.json
 1. voice over everything else during every line: K-weighted voice stem against music + foley + room (>= 8 dB)
 2. the file: 1080x1920, 30 fps, 15-20 s, picture = audio length, -14 +-0.5 LUFS, true peak <= -1 dBTP, loudnorm pass linear,
    blackdetect finds nothing, under ~15 MB
 3. ElevenLabs speech-to-text (Korean) of the file's audio hears every line, in order
 4. dialogue gaps <= 0.3 s (overlap allowed), the cut 0.2 s after the last line
 5. the rig checks written by the render: arm attachment on every frame of the arm shot (out/arm_check.json), subtitles
    never over a face and faces inside the middle 3:4 band (out/face_sub_check.json), cut-out fringe (out/cutout.json),
    expression-swap jitter (out/register.json, out/swap_jitter.json)
 6. a contact sheet every 0.5 s of the file: review/contact_sheet_0.5s.jpg (look at it)
  python tools/check.py [--no-stt]
"""
import json, os, re, subprocess, sys
from difflib import SequenceMatcher
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MP4 = os.path.join(HERE, "exile_test.mp4")
SR = 48000
TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
sys.path.insert(0, os.path.join(HERE, "tools"))
from asr_eleven import norm, transcribe                                   # noqa: E402
fails, R = [], {}


def say(ok, msg):
    print(("PASS  " if ok else "FAIL  ") + msg)
    if not ok: fails.append(msg)


def kw(x):
    b1, a1 = signal.butter(2, 1500 / (SR / 2), "highpass")
    y = x + 0.585 * signal.lfilter(b1, a1, x, axis=0)
    b2, a2 = signal.butter(2, 38 / (SR / 2), "highpass")
    return signal.lfilter(b2, a2, y, axis=0)


def margins():
    st = {k: sf.read(os.path.join(HERE, "out", "stems", k + ".wav"), always_2d=True)[0] for k in ["voice", "music", "foley", "room"]}
    v = kw(st["voice"]); o = kw(st["music"] + st["foley"] + st["room"])
    p = lambda x: float(np.mean(x ** 2) + 1e-14)
    worst = (99, None)
    for L in TL["VO"]:
        a, b = int(L["t"] * SR), int((L["t"] + L["dur"]) * SR)
        whole = 10 * np.log10(p(v[a:b]) / p(o[a:b]))
        w, h = int(.4 * SR), int(.1 * SR)
        wins = [10 * np.log10(p(v[i:i + w]) / p(o[i:i + w])) for i in range(a, max(a + 1, b - w), h) if 10 * np.log10(p(v[i:i + w])) > 10 * np.log10(p(v[a:b])) - 8]
        wmin = min(wins) if wins else whole
        print(f"  {L['id']}  {L['who']:6s} voice over the rest: whole {whole:5.1f} dB, worst 400 ms {wmin:5.1f} dB")
        worst = min(worst, (min(whole, wmin), L["id"]))
    say(worst[0] >= 8, f"voice over everything else: worst {worst[0]:.1f} dB ({worst[1]}), needs >= 8")
    R["voice_margin_db"] = round(worst[0], 1)


def media():
    pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration,size",
                                    "-of", "json", MP4], capture_output=True, text=True).stdout)
    vs = next(s for s in pr["streams"] if s["codec_type"] == "video")
    d = float(pr["format"]["duration"]); size = int(pr["format"]["size"])
    pic = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(HERE, "out", "video.mp4")], capture_output=True, text=True).stdout)
    say(vs["width"] == 1080 and vs["height"] == 1920 and vs["r_frame_rate"] == "30/1", f"format {vs['width']}x{vs['height']} @ {vs['r_frame_rate']}")
    say(15 <= d <= 20 and abs(d - pic) < .1, f"duration {d:.3f} s (picture {pic:.3f} s)")
    say(size < 15.5e6, f"size {size / 1e6:.2f} MB")
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", MP4, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    s = e[e.rfind("Summary"):]
    I = float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1)); tp = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))
    say(abs(I + 14) <= .5, f"loudness {I:.1f} LUFS")
    say(tp <= -1.0, f"true peak {tp:.1f} dBTP")
    log = open(os.path.join(HERE, "out", "mux.log")).read()
    mode = re.search(r"normalization_type (\w+)", log)
    say(bool(mode) and mode.group(1) == "linear", f"loudnorm second pass: {mode.group(1) if mode else '?'}")
    b = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", MP4, "-vf", "blackdetect=d=0.05:pix_th=0.10", "-an", "-f", "null", "-"], capture_output=True, text=True).stderr
    blk = re.findall(r"black_start:\s*([\d.]+)", b)
    say(not blk, "black frames: " + ("0" if not blk else "black at " + ", ".join(blk)))
    R.update({"duration_s": round(d, 3), "lufs": I, "true_peak_dbtp": tp, "size_mb": round(size / 1e6, 2), "black_segments": len(blk), "loudnorm": mode.group(1) if mode else "?"})


def stt():
    mp3 = os.path.join(HERE, "out", "final_check.mp3")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", MP4, "-vn", "-ac", "1", "-b:a", "96k", mp3], check=True)
    d = transcribe(mp3, "ko")
    heard = d.get("text", "")
    open(os.path.join(HERE, "out", "final_stt.txt"), "w").write(heard + "\n")
    print("  heard:", heard)
    H = norm(heard)
    pos, ok_all, per = 0, True, {}
    for L in TL["VO"]:
        W = norm(L["sub"])
        best, at = 0.0, pos
        for i in range(max(0, pos - 4), max(pos + 1, len(H) - len(W) + 6)):
            r = SequenceMatcher(None, W, H[i:i + len(W)]).ratio()
            if r > best: best, at = r, i
        ok = best >= .8
        ok_all &= ok
        if ok: pos = at + len(W) - 3
        per[L["id"]] = round(best, 3)
        print(f"  {'ok ' if ok else 'BAD'} {L['id']} {best:.2f}  {L['sub']}")
    say(ok_all, "speech-to-text (ko) heard every line, in order")
    R["stt_line_similarity"] = per


def timing():
    g = TL["GAPS"]
    say(max(g.values()) <= 0.3, "dialogue gaps " + ", ".join(f"{k} {v:+.2f} s" for k, v in g.items()) + " (<= 0.3 s, overlap allowed)")
    last = TL["VO"][-1]
    tail = TL["DUR"] - (last["t"] + last["dur"])
    say(abs(tail - 0.2) < 0.02, f"cut {tail:.2f} s after the last line")
    R["gaps_s"] = g; R["tail_s"] = round(tail, 3)


def rig():
    arm = json.load(open(os.path.join(HERE, "out", "arm_check.json")))["summary"]
    say(arm["all_ok"], f"arm on all {arm['frames']} frames of the arm shot: root on bust >= {arm['root_on_bust_min']:.3f}, head clash {arm['head_clash_px_max']} px, "
                       f"joint holes {arm['joint_holes_px_max']} px, arm >= {arm['arm_to_head_px_min']} px from hair/face, width ratio {arm['width_ratio']}")
    fs = json.load(open(os.path.join(HERE, "out", "face_sub_check.json")))["summary"]
    say(fs["max_overlap_px2"] == 0 and fs["faces_out_of_band"] == 0, f"subtitles never over a face (closest {fs['min_gap_face_bottom_to_subtitle_top_px']} px), faces in the 3:4 band on every checked frame ({fs['frames_checked']})")
    cut = json.load(open(os.path.join(HERE, "out", "cutout.json")))
    parts = ["sera_neutral", "sera_talk", "sera_angry", "sera_blink", "arm_point", "minsu_neutral", "minsu_talk", "minsu_blink", "pigeon_neutral", "pigeon_open"]
    fr = {k: cut[k]["fringe_px"] for k in parts}; naive = {k: cut[k]["naive_fringe_px"] for k in parts}
    tested = sum(cut[k]["edge_px_tested"] for k in parts)
    say(sum(fr.values()) <= 0.01 * tested, f"cut-out fringe: {sum(fr.values())} of {tested} edge px (naive hard cut: {sum(naive.values())})")
    reg = json.load(open(os.path.join(HERE, "out", "register.json")))
    worst = max(v["after"]["shift_px_frame"] for v in reg.values())
    sw = json.load(open(os.path.join(HERE, "out", "swap_jitter.json")))
    worst_sw = max(v["residual_shift_px_on_screen"] for v in sw.values())
    say(worst < 1.0 and worst_sw < 0.5, f"expression swaps: registration residual <= {worst:.2f} px on screen (before: up to {max(v['before']['shift_px_frame'] for v in reg.values()):.1f} px), "
                                       f"rendered flick shift <= {worst_sw:.2f} px")
    R.update({"arm": arm, "faces_vs_subs": fs, "fringe_px": sum(fr.values()), "fringe_naive_px": sum(naive.values()), "edge_px_tested": tested,
              "swap_registration_residual_px": worst, "swap_flick_shift_px": worst_sw})


def sheet():
    rv = os.path.join(HERE, "review", "contact")
    os.makedirs(rv, exist_ok=True)
    for f in os.listdir(rv): os.remove(os.path.join(rv, f))
    d = R["duration_s"]
    for t in np.arange(0, d - .02, 0.5):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", MP4, "-frames:v", "1", "-q:v", "3", os.path.join(rv, f"t_{t:05.2f}.jpg")], check=True)
    subprocess.run([os.path.join(HERE, "..", ".venv-daily", "bin", "python"), os.path.join(HERE, "..", "vm13-rewards-program", "tools", "sheet.py"),
                    os.path.join(HERE, "review", "contact_sheet_0.5s.jpg")] + sorted(os.path.join(rv, f) for f in os.listdir(rv)) + ["--cols", "8", "--w", "200"], check=True)


if __name__ == "__main__":
    margins(); media()
    if "--no-stt" not in sys.argv: stt()
    timing(); rig(); sheet()
    R["fails"] = fails
    json.dump(R, open(os.path.join(HERE, "out", "final_check.json"), "w"), indent=1, ensure_ascii=False)
    print("ALL PASS" if not fails else f"{len(fails)} FAIL(S)")
    sys.exit(1 if fails else 0)
