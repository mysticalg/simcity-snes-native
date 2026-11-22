# Audio envelope component

`src/rom-envelope.js` adapts the envelope/counter behavior from Shay Green's
`snes_spc` 0.9.0 `SPC_DSP.cpp`, Copyright (C) 2007 Shay Green, licensed under
GNU LGPL version 2.1 or (at your option) any later version. The JS adaptation
is distributed under those same terms. Its source is included in this repository.

Reference: https://github.com/snes9xgit/snes9x/blob/master/apu/bapu/dsp/SPC_DSP.cpp

Changes: envelope-only native JavaScript renderer; explicit key-off, key-on delay
and counter-phase parameters; no SPC CPU or full DSP implementation.
The included LGPL text applies to this component, not to the extracted ROM assets.
