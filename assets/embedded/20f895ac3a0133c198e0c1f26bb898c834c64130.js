(function rackRacerWarmup() {
'use strict';
if (window.RackRacerWarmup) return;
var api = {
version:'2',
drawn:0,
renderers:0,
passes:0,
built:[],
skipped:[],
failed:[],
ms:0,
tick:tick
};
window.RackRacerWarmup = api;
var seen = typeof WeakMap === 'function' ? new WeakMap() :null;
var lastSeen = null;
var clock = function() {
return typeof performance !== 'undefined' ? performance.now() :Date.now();
};
var own = function(name) {
switch (name) {
case 'App':return typeof App !== 'undefined' ? App :null;
case 'Multiplayer':return typeof Multiplayer !== 'undefined' ? Multiplayer :null;
case 'RubinView':return typeof RubinView !== 'undefined' ? RubinView :null;
case 'RackRunLook168':return typeof RackRunLook168 !== 'undefined' ? RackRunLook168 :null;
case 'RackRunLook169':return typeof RackRunLook169 !== 'undefined' ? RackRunLook169 :null;
case 'RackRunLook1612':return typeof RackRunLook1612 !== 'undefined' ? RackRunLook1612 :null;
case 'RackRunLook1613':return typeof RackRunLook1613 !== 'undefined' ? RackRunLook1613 :null;
case 'RackRunLook1618':return typeof RackRunLook1618 !== 'undefined' ? RackRunLook1618 :null;
case 'RackRunLook1623':return typeof RackRunLook1623 !== 'undefined' ? RackRunLook1623 :null;
}
return null;
};
var racing = function() {
try {
var mp = own('Multiplayer');
if (mp && mp.room) {
if (mp.room.phase !== 'race') return false;
return !(mp.state && mp.state.countdown > 0);
}
var app = own('App');
return !!app && app.state === 'running' && !(app.countdown > 0);
} catch (e) {
return true;
}
};
var renderer = function() {
var view = own('RubinView');
var r = view && view.instance;
return r && r.gl && !r.lost && typeof r.programFor === 'function' ? r :null;
};
var steps = [
['smoke',function(r) {
var m = own('RackRunLook1618');
if (!m || typeof m.ensure !== 'function') return 'skip';
var p = typeof m.policy === 'function' ? m.policy() :null;
if (p && !p.softSmoke) return 'skip';
return m.ensure(r) ? true :false;
}],
['motion mask',function(r) {
var base = own('RackRunLook168'),
m = own('RackRunLook1613');
var programs = base && typeof base.state === 'function' && base.state(r).programs;
if (!m || typeof m.maskProgram !== 'function' || !programs) return 'skip';
return !!m.maskProgram(r);
}],
['speed streak',function(r) {
var base = own('RackRunLook168'),
m = own('RackRunLook1612');
if (!m || typeof m.streakProgram !== 'function' || !(base && base.state(r).programs)) return 'skip';
return !!m.streakProgram(r);
}],
['light shafts',function(r) {
var base = own('RackRunLook168'),
m = own('RackRunLook1623');
if (!m || typeof m.shaftProgram !== 'function' || !(base && base.state(r).programs)) return 'skip';
m.shaftProgram(r);
return true;
}],
['ambient occlusion',function(r) {
var base = own('RackRunLook168'),
m = own('RackRunLook169');
if (!m || typeof m.occlusionPrograms !== 'function' || !(base && base.state(r).programs)) return 'skip';
m.occlusionPrograms(r);
return true;
}]
];
function note(list,name) {
if (list.indexOf(name) < 0) list.push(name);
}
function tick() {
var r = renderer();
if (!r || racing()) return false;
var st = seen ? seen.get(r) :lastSeen && lastSeen.r === r ? lastSeen.st :null;
if (!st) {
st = {
built:{},
failed:{}
};
if (seen) seen.set(r,st);
else lastSeen = {
r:r,
st:st
};
api.renderers++;
}
var t0 = clock(),
worked = false;
for (var i = 0;i < steps.length;i++) {
var name = steps[i][0];
if (st.built[name] || st.failed[name]) continue;
var out;
try {
out = steps[i][1](r);
} catch (e) {
out = false;
}
if (out === 'skip') {
note(api.skipped,name);
continue;
}
worked = true;
if (out) {
st.built[name] = true;
note(api.built,name);
if (name === 'smoke') st.drawSmoke = true;
} else {
st.failed[name] = true;
note(api.failed,name);
}
}
if (worked) {
api.passes++;
api.ms = Math.round((api.ms + clock() - t0) * 10) / 10;
}
return worked;
}
var pendingDraw = function(r) {
var st = seen ? seen.get(r) :lastSeen && lastSeen.r === r ? lastSeen.st :null;
return st && st.drawSmoke ? st :null;
};
try {
var GL = typeof RubinGL !== 'undefined' ? RubinGL :null;
if (GL && GL.prototype && typeof GL.prototype.flush === 'function' && !GL.prototype.flush.__rrWarm) {
var baseFlush = GL.prototype.flush;
var flush = function() {
try {
var st = pendingDraw(this);
var look = typeof RackRunLook1618 !== 'undefined' ? RackRunLook1618 :null;
if (st && look && look.smoke && !racing() && (!look.policy || look.policy().softSmoke)) {
st.drawSmoke = false;
look.smoke.push(0,-500,0,.01,.01,.01,0,1,1,1,0,0,1,0);
api.drawn++;
}
} catch (e) {}
return baseFlush.apply(this,arguments);
};
flush.__rrWarm = true;
GL.prototype.flush = flush;
}
} catch (e) {}
setInterval(function() {
try {
tick();
} catch (e) {}
},400);
})();