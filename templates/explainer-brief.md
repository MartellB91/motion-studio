# Explainer video brief (template)

Fill in everything in [brackets], then hand this to Claude.
Reference build: `videos/junctri-explainer.html`

CONTEXT: I run [BUSINESS NAME AND WHAT IT DOES]. This video plays on [PLATFORMS / CHANNELS].

RESULT: A [15]-second animated explainer, [1920x1080], using brand.css.
Title: "[TITLE]". Then these steps appear one at a time, each with a big number, a short headline and one small line under it:
1. [STEP 1 HEADLINE] / [STEP 1 LINE]
2. [STEP 2 HEADLINE] / [STEP 2 LINE]
3. [STEP 3 HEADLINE] / [STEP 3 LINE]
End on "[CLOSING NAME]" with "[CALL TO ACTION]". Smooth easing, no hard cuts.

STYLE CHOICES (change if wanted):
- Title: [disappears after the intro | shrinks into a persistent header]
- Steps: [stack up, then clear before the end card | replace each other | stay stacked to the end]

OFF-LIMITS: No stock footage, no people, no words I didn't write, no colors outside brand.css. If anything is unclear, ask me before you build.

SHOW YOUR WORK: Before you write code, give me a scene-by-scene storyboard with timings and wait for my OK. After you build it, run --stills 3 and show me the stills before the full render.

NEVER TWICE: When I approve the video, save this brief as a template in a templates folder with [brackets] for the parts that change.

## Default timing used for the 15 s version
- 0.0-2.4 s   Title alone, centered, rule draws under it
- 2.2-3.0 s   Title fades out
- 2.8 / 4.6 / 6.4 s   Steps 1, 2, 3 appear (number, headline, then line)
- 8.2-9.6 s   Hold so all three can be read
- 9.6-10.6 s  Stack fades out together
- 10.2-15.0 s End card: name, rule, call to action; last ~3 s held still

## Render
    node render.mjs <video-name> --stills 3        # check first
    node render.mjs <video-name> --at 1.5,8.8,14.5 # stills at exact seconds
    node render.mjs <video-name>                   # full MP4 in out/
