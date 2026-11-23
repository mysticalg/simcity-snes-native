# Water reach versus finite supply — v0.2.19

The blue underground field previously indicated source-connected pipe reach
before allocating finite water, while its legend called it supplied. A reachable
zone could therefore remain dry after earlier zones consumed the network pool.
This release keeps the same5000/pump and whole-zone demand/scan ordering, but
records each zone's actual allocation, network and reason. Connected pipe groups
report requested demand, used supply, capacity and shortage. Missing source and
out-of-reach are distinct from capacity exhaustion.

Inspection now shows Water allocated and, for a shortage, network demand versus
capacity and the additional working pumps required. Pump meters and pipe hover
also report network demand/shortage. The underground legend says blue is reach,
green plots are actually supplied, amber plots need more pumping, grey has no
source. Plot outlines match construction footprints. Added pumps immediately
recompute allocation; session reload derives it from the saved city.

370 Node tests pass, including a real8000-demand/5000-supply reproduction, the
added-pump recovery to10000 supply, and separate no-source/out-of-range cases.
Real Chromium verifies the inspector, coloured overlay, one new pump supplying
all ten residential zones, save/reload and no page errors; screenshots reviewed.
This is a player extension; full original-game port and the additional civic,
health/security/disaster/monorail requests remain active work.

The test server at5201 served an olderv0.2.2 checkout, diagnosed from its actual
HTML. A different fixed port was OS-reserved. Verification used a new server on
an OS-assigned available port, with an explicit directory and module MIME types;
no existing listener was restarted. Do not reuse5201 as proof of this worktree.
