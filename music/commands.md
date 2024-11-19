# Commands

Pretty sure XLD is unused but the settings are

```text
%A/%A - %T (%y)/%A - %T - %y - %D-%n - %a - %t
```

![XLD rename settings](xld.png)

Rename with Yate to

```text
❨Album Artist❩ - ❨Album❩ - ❨Year4❩ -
❨IfExists Disc❩
    ❨Disc Pad2❩-
❨endIf❩
❨Track Pad2❩ - ❨Artist❩ - ❨Title❩
```

![Yate rename settings](yate.png)

Flatten with Big Mean Folder Machine

```fish
find . | \
parallel -j16 \
  "ffmpeg -i {} -ar 44100 -ac 2 -af aresample=osf=s16:rematrix_maxval=1.0:dither_method=improved_e_weighted /Users/dave/Resilio/3.Decimated/{.}.flac"
```

```fish
ffmpeg -i {} \
  -ar 44100 \
  -ac 2 \
  -af aresample=osf=s16:rematrix_maxval=1.0:dither_method=improved_e_weighted \
  ../3.Decimated/{.}.flac
```

```fish
find . | \
cut -b 3- | \
parallel -j16 \
  "if flac -t {} ; echo {}: ok >> log; else; echo {}: failed >> log; end"
```

```fish
if flac -t {}
  echo {}: ok >> ../log
else
  echo {}: failed >> ../log
end```
