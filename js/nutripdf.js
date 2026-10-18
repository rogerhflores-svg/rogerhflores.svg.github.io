/* =====================================================================
   NutriPDF — generador de PDF propio (sin librerías ni internet).
   Fuentes estándar de PDF (Helvetica), texto en codificación WinAnsi.
   ===================================================================== */
const NutriPDF = (function(){
  const HW=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const BW=[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];

  const SH = {128:556,133:1000,145:222,146:222,147:333,148:333,149:350,150:556,151:1000,153:1000,160:278,161:333,170:370,171:556,176:400,177:584,178:333,179:333,181:556,183:278,185:333,186:365,187:556,188:834,189:834,190:834,191:611,198:1000,215:584,216:778,223:611,230:889,247:584,248:611};
  const SB = Object.assign({}, SH, {145:278,146:278,147:500,148:500,191:611,161:333});
  const MAP = {'–':'\u0096','—':'\u0097','•':'\u0095','…':'\u0085','‘':'\u0091','’':'\u0092','“':'\u0093','”':'\u0094','€':'\u0080','™':'\u0099',
    '≥':'>=','≤':'<=','→':'->','←':'<-','≈':'~','−':'-','‐':'-','‑':'-','≠':'!=','⁄':'/','×':'\u00D7','µ':'\u00B5','↑':'^','↓':'v','✓':'','✔':'','⚠':'','·':'\u00B7'};
  const COL = {ink:'#1c2b40', ink2:'#3d4d63', muted:'#5c6b82', orange:'#E8791E', gold:'#8a6a1f', green:'#1D9E75', blue:'#2f6fb0',
    soft:'#f3efe0', line:'#ecdfc0', box:'#fdf6ea', boxline:'#f0d99a', red:'#c0453a', yellow:'#d9a21b', white:'#ffffff', paper:'#fffdf7', graphite:'#2a3446'};
  const CHIP = {green:{bg:'#dff3ea',fg:'#12694e'}, yellow:{bg:'#fbefcf',fg:'#7a5a05'}, red:{bg:'#f8dcd8',fg:'#992f26'},
    orange:{bg:'#fde3cc',fg:'#a4510a'}, blue:{bg:'#dbe8f6',fg:'#1f4f85'}, gray:{bg:'#ece8da',fg:'#5c6b82'}};

  function sanitize(s){
    s = String(s==null ? '' : s).normalize('NFC').replace(/[\u00A0\u2007\u202F]/g,' ').replace(/[\u200B-\u200F\uFE0E\uFE0F\u2060\u00AD]/g,'');
    let o = '';
    for(const ch of s){
      const c = ch.codePointAt(0);
      if(c < 32){ if(c===10) o += '\n'; else if(c===9) o += ' '; continue; }
      if(c < 127 || (c >= 160 && c <= 255)){ o += ch; continue; }
      if(c === 127) continue;
      if(MAP[ch] !== undefined){ o += MAP[ch]; continue; }
      const nk = ch.normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
      if(nk && /^[\x20-\x7e]+$/.test(nk)){ o += nk; continue; }
    }
    return o;
  }
  function cw(c, b){
    if(c >= 32 && c <= 126) return (b ? BW : HW)[c-32];
    const S = b ? SB : SH;
    if(S[c] !== undefined) return S[c];
    if(c >= 192){
      const base = String.fromCharCode(c).normalize('NFD')[0].charCodeAt(0);
      if(base >= 32 && base <= 126) return (b ? BW : HW)[base-32];
    }
    return 556;
  }
  function tw(s, size, b){ let w = 0; for(let i=0;i<s.length;i++) w += cw(s.charCodeAt(i), b); return w*size/1000; }
  function rgb(hex){ const h = hex.replace('#',''); return [parseInt(h.substr(0,2),16)/255, parseInt(h.substr(2,2),16)/255, parseInt(h.substr(4,2),16)/255]; }
  function col(hex, stroke){ const c = rgb(hex); return c.map(v=>v.toFixed(3)).join(' ') + (stroke ? ' RG' : ' rg'); }
  function esc(s){ return s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)'); }
  const n2 = v => (Math.round(v*100)/100).toString();

  class Doc {
    constructor(o){
      this.o = o || {};
      this.W = 595.28; this.H = 841.89; this.M = 34; this.top = 40; this.bottom = 46;
      this.pages = []; this.blocks = [];
      this.title = this.o.title || 'Documento';
      this.running = this.o.running || '';
      this.author = this.o.author || '';
      this.disclaimer = this.o.disclaimer || '';
      this.x = this.M; this.w = this.W - 2*this.M; this.y = this.top;
      this._newPage(true);
    }
    /* ---------- páginas ---------- */
    _newPage(first){
      this.cur = {ops: []};
      this.pages.push(this.cur);
      this.y = this.top;
      if(!first){
        this.rectAbs(0, 0, this.W, 6, {fill: COL.orange});
        this.textAbs(this.running, this.M, 26, {size: 8.5, b: true, color: COL.ink2});
        this.textAbs('NutriAndes · ' + this.title, this.W - this.M, 26, {size: 8, color: COL.muted, align: 'right'});
        this.lineAbs(this.M, 32, this.W - this.M, 32, {c: COL.line, lw: 0.8});
        this.y = this.top;
      }
    }
    newPage(){
      const saved = this.blocks.map(b=>{ this._paintBlock(b, Math.min(this.y, this.H - this.bottom)); return b; });
      this._newPage(false);
      saved.forEach(b=>{ b.page = this.cur; b.idx = this.cur.ops.length; b.y0 = this.y; });
      if(saved.length) this.y += 3;
    }
    ensure(h){ if(this.y + h > this.H - this.bottom) this.newPage(); }
    space(h){ this.y += h; }

    /* ---------- primitivas (coordenadas desde arriba) ---------- */
    _push(op){ this.cur.ops.push(op); }
    rectAbs(x, y, w, h, o){ this._rect(this.cur, x, y, w, h, o); }
    _rect(page, x, y, w, h, o){
      o = o || {};
      const py = this.H - y - h;
      let path;
      if(o.r && o.r > 0){
        const r = Math.min(o.r, w/2, h/2), k = r*0.5523;
        path = `${n2(x+r)} ${n2(py)} m ${n2(x+w-r)} ${n2(py)} l ${n2(x+w-r+k)} ${n2(py)} ${n2(x+w)} ${n2(py+r-k)} ${n2(x+w)} ${n2(py+r)} c ${n2(x+w)} ${n2(py+h-r)} l ${n2(x+w)} ${n2(py+h-r+k)} ${n2(x+w-r+k)} ${n2(py+h)} ${n2(x+w-r)} ${n2(py+h)} c ${n2(x+r)} ${n2(py+h)} l ${n2(x+r-k)} ${n2(py+h)} ${n2(x)} ${n2(py+h-r+k)} ${n2(x)} ${n2(py+h-r)} c ${n2(x)} ${n2(py+r)} l ${n2(x)} ${n2(py+r-k)} ${n2(x+r-k)} ${n2(py)} ${n2(x+r)} ${n2(py)} c h`;
      } else path = `${n2(x)} ${n2(py)} ${n2(w)} ${n2(h)} re`;
      let s = 'q ';
      if(o.fill) s += col(o.fill) + ' ';
      if(o.stroke) s += col(o.stroke, true) + ' ' + n2(o.lw || 0.8) + ' w ';
      s += path + ' ' + (o.fill && o.stroke ? 'B' : (o.fill ? 'f' : 'S')) + ' Q';
      page.ops.push(s);
    }
    lineAbs(x1, y1, x2, y2, o){
      o = o || {};
      this._push(`q ${col(o.c || COL.line, true)} ${n2(o.lw || 0.8)} w ${o.dash ? '['+o.dash+'] 0 d ' : ''}${n2(x1)} ${n2(this.H-y1)} m ${n2(x2)} ${n2(this.H-y2)} l S Q`);
    }
    /* texto: y = línea base */
    textAbs(str, x, y, o){
      o = o || {};
      const size = o.size || 9.5, bold = !!o.b, it = !!o.i;
      const t = sanitize(str).replace(/\n/g,' ');
      let xx = x;
      if(o.align === 'right') xx = x - tw(t, size, bold);
      else if(o.align === 'center') xx = x - tw(t, size, bold)/2;
      const f = bold ? 'F2' : (it ? 'F3' : 'F1');
      this._push(`BT /${f} ${n2(size)} Tf ${col(o.color || COL.ink)} 1 0 0 1 ${n2(xx)} ${n2(this.H - y)} Tm (${esc(t)}) Tj ET`);
    }

    /* ---------- bloques con fondo (pueden cruzar páginas) ---------- */
    beginBlock(o){
      o = o || {};
      const pad = o.pad === undefined ? 8 : o.pad, bar = o.bar ? 3.2 : 0;
      this.ensure((o.minH || 28) + pad);
      const b = {bg: o.bg, line: o.line, bar: o.bar, r: o.r === undefined ? 6 : o.r, pad: pad, ox: this.x, ow: this.w,
                 page: this.cur, idx: this.cur.ops.length, y0: this.y};
      this.blocks.push(b);
      this.y += pad;
      this.x += pad + bar; this.w -= 2*pad + bar;
    }
    endBlock(){
      const b = this.blocks.pop();
      this.y += b.pad;
      this._paintBlock(b, this.y);
      this.x = b.ox; this.w = b.ow;
    }
    _paintBlock(b, yEnd){
      const h = yEnd - b.y0; if(h <= 1) return;
      const tmp = {ops: []};
      if(b.bg || b.line) this._rect(tmp, b.ox, b.y0, b.ow, h, {fill: b.bg, stroke: b.line, r: b.r, lw: 0.8});
      if(b.bar) this._rect(tmp, b.ox, b.y0 + 1, 3.2, h - 2, {fill: b.bar, r: 1.6});
      b.page.ops.splice(b.idx, 0, tmp.ops.join('\n'));
      b.idx += 0; /* los siguientes ya se calculan con la longitud real */
    }

    /* ---------- texto con formato ---------- */
    wrap(runs, maxW, size, defBold){
      if(typeof runs === 'string') runs = [{t: runs}];
      const lines = []; let cur = {segs: [], w: 0};
      const push = ()=>{
        const l = cur.segs[cur.segs.length-1];
        if(l){ const t2 = l.t.replace(/ +$/, ''); if(t2 !== l.t){ cur.w -= l.w; l.t = t2; l.w = tw(t2, size, l.b); cur.w += l.w; if(!t2) cur.segs.pop(); } }
        lines.push(cur); cur = {segs: [], w: 0};
      };
      const add = (t, st, w)=>{
        const l = cur.segs[cur.segs.length-1];
        if(l && l.b === st.b && l.i === st.i && l.c === st.c){ l.t += t; l.w += w; }
        else cur.segs.push({t: t, b: st.b, i: st.i, c: st.c, w: w});
        cur.w += w;
      };
      for(const run of runs){
        if(!run) continue;
        const st = {b: !!(run.b || defBold), i: !!run.i, c: run.c};
        const parts = sanitize(run.t).split(/(\n| +)/);
        for(const p of parts){
          if(p === '') continue;
          if(p === '\n'){ push(); continue; }
          if(p[0] === ' '){ if(cur.w === 0) continue; add(' ', st, tw(' ', size, st.b)); continue; }
          const w = tw(p, size, st.b);
          if(cur.w + w > maxW + 0.01 && cur.w > 0) push();
          if(w > maxW){
            let chunk = '';
            for(const ch of p){
              if(tw(chunk + ch, size, st.b) > maxW && chunk){ add(chunk, st, tw(chunk, size, st.b)); push(); chunk = ch; } else chunk += ch;
            }
            if(chunk) add(chunk, st, tw(chunk, size, st.b));
            continue;
          }
          add(p, st, w);
        }
      }
      if(cur.segs.length || !lines.length) push();
      return lines;
    }
    _line(ln, x, y, size, color, align, w){
      let xx = x;
      if(align === 'right') xx = x + w - ln.w; else if(align === 'center') xx = x + (w - ln.w)/2;
      for(const s of ln.segs){
        const f = s.b ? 'F2' : (s.i ? 'F3' : 'F1');
        this._push(`BT /${f} ${n2(size)} Tf ${col(s.c || color)} 1 0 0 1 ${n2(xx)} ${n2(this.H - y)} Tm (${esc(s.t)}) Tj ET`);
        xx += s.w;
      }
    }
    para(runs, o){
      o = o || {};
      const size = o.size || 9.2, lh = (o.lh || 1.38) * size;
      const x = o.x !== undefined ? o.x : this.x, w = o.w || this.w;
      const lines = this.wrap(runs, w, size, o.b);
      for(const ln of lines){
        this.ensure(lh);
        this._line(ln, x, this.y + size*0.98, size, o.color || COL.ink, o.align, w);
        this.y += lh;
      }
      this.y += (o.after === undefined ? 3 : o.after);
    }

    /* ---------- componentes ---------- */
    hero(o){
      const H = 96;
      this.rectAbs(0, 0, this.W, H, {fill: COL.orange});
      this.rectAbs(0, H, this.W, 4, {fill: COL.gold});
      this.rectAbs(this.M, 22, 44, 52, {fill: COL.white, r: 12});
      this.textAbs('N', this.M + 22, 58, {size: 28, b: true, color: COL.orange, align: 'center'});
      this.textAbs(o.title, this.M + 58, 42, {size: 20, b: true, color: COL.white});
      this.textAbs(o.sub || '', this.M + 58, 58, {size: 9, color: '#fff1e2'});
      this.textAbs(o.sub2 || '', this.M + 58, 71, {size: 8, color: '#ffe3c7'});
      if(o.right){
        const ls = String(o.right).split('\n');
        ls.forEach((t, i)=> this.textAbs(t, this.W - this.M, 40 + i*13, {size: i ? 11 : 7.5, b: !!i, color: COL.white, align: 'right'}));
      }
      this.y = H + 18;
    }
    heading(text, o){
      o = o || {};
      this.ensure(40);
      this.y += 6;
      const c = o.color || COL.orange;
      this.rectAbs(this.x, this.y + 1, 5, 15, {fill: c, r: 2});
      this.textAbs(text, this.x + 12, this.y + 13, {size: 12.5, b: true, color: COL.ink});
      this.lineAbs(this.x, this.y + 21, this.x + this.w, this.y + 21, {c: COL.line, lw: 0.9});
      this.y += 28;
    }
    subheading(text, color){
      this.ensure(22);
      this.textAbs(text, this.x, this.y + 10, {size: 10, b: true, color: color || COL.gold});
      this.y += 16;
    }
    chip(text, x, y, o){
      o = o || {}; const size = o.size || 7.5, st = CHIP[o.k] || CHIP.gray;
      const w = tw(sanitize(text), size, true) + 10, h = size + 6;
      this.rectAbs(x, y, w, h, {fill: o.bg || st.bg, r: h/2});
      this.textAbs(text, x + 5, y + size + 1.6, {size: size, b: true, color: o.fg || st.fg});
      return w;
    }
    kpis(items, per){
      per = per || Math.min(items.length, 4);
      const gap = 7, w = (this.w - gap*(per-1))/per, h = 48;
      for(let i = 0; i < items.length; i += per){
        this.ensure(h + 6);
        items.slice(i, i+per).forEach((it, j)=>{
          const x = this.x + j*(w + gap), c = it.color || COL.orange;
          this.rectAbs(x, this.y, w, h, {fill: COL.soft, r: 7});
          this.rectAbs(x, this.y, w, 3.4, {fill: c, r: 1.7});
          this.textAbs(String(it.label).toUpperCase(), x + 8, this.y + 14, {size: 6.8, b: true, color: COL.muted});
          let vs = 14; const vt = sanitize(it.value);
          while(vs > 8 && tw(vt, vs, true) > w - 14) vs -= 0.5;
          this.textAbs(it.value, x + 8, this.y + 31, {size: vs, b: true, color: COL.ink});
          if(it.sub) this.textAbs(it.sub, x + 8, this.y + 42, {size: 6.8, color: COL.muted});
        });
        this.y += h + 7;
      }
    }
    callout(runs, o){
      o = o || {};
      const tone = {warn:{bg:'#fdf6ea', bar:COL.orange, line:COL.boxline}, danger:{bg:'#fbe9e6', bar:COL.red, line:'#efc2bb'},
                    ok:{bg:'#e8f6f0', bar:COL.green, line:'#bfe3d3'}, info:{bg:'#e9f1fa', bar:COL.blue, line:'#c6d9ee'}, note:{bg:COL.soft, bar:COL.line, line:COL.line}}[o.tone || 'warn'];
      this.beginBlock({bg: tone.bg, bar: tone.bar, line: tone.line, pad: o.pad || 8});
      if(o.title) this.para([{t: o.title, b: true}], {size: (o.size || 9) + 0.6, color: o.titleColor || COL.ink, after: 2});
      this.para(runs, {size: o.size || 9, color: o.color || COL.ink2, after: 0});
      this.endBlock();
      this.y += 5;
    }
    bullets(items, o){
      o = o || {};
      const size = o.size || 9, ind = 11;
      for(const it of items){
        const lines = this.wrap(it.runs || it, this.w - ind, size);
        const lh = size*1.38;
        this.ensure(Math.min(lines.length, 2)*lh + 2);
        this.rectAbs(this.x + 1, this.y + size*0.38, 4.2, 4.2, {fill: it.color || o.color || COL.orange, r: 2.1});
        for(const ln of lines){
          this.ensure(lh);
          this._line(ln, this.x + ind, this.y + size*0.98, size, COL.ink, 'left', this.w - ind);
          this.y += lh;
        }
        this.y += 2.2;
      }
      this.y += 2;
    }
    /* tarjetas de diagnóstico (2 por fila) */
    cards(items, per){
      per = per || 2;
      const gap = 8, w = (this.w - gap*(per-1))/per, h = 62;
      for(let i = 0; i < items.length; i += per){
        this.ensure(h + 8);
        items.slice(i, i+per).forEach((it, j)=>{
          const x = this.x + j*(w + gap), k = it.k || 'gray';
          const c = {green:COL.green, yellow:COL.yellow, red:COL.red, blue:COL.blue, orange:COL.orange}[k] || COL.muted;
          this.rectAbs(x, this.y, w, h, {fill: COL.white, stroke: COL.line, r: 8, lw: 0.9});
          this.rectAbs(x, this.y, 5, h, {fill: c, r: 2.5});
          this.textAbs(String(it.title || '').toUpperCase(), x + 13, this.y + 14, {size: 6.8, b: true, color: COL.muted});
          let vs = 13; while(vs > 8 && tw(sanitize(it.value||''), vs, true) > w - 22) vs -= 0.5;
          this.textAbs(it.value || '', x + 13, this.y + 30, {size: vs, b: true, color: c});
          this.textAbs(it.sub || '', x + 13, this.y + 43, {size: 8, color: COL.ink2});
          if(it.z){ const zw = tw(sanitize(it.z), 7.5, true) + 12; this.rectAbs(x + 13, this.y + 48, zw, 11, {fill: c, r: 5.5}); this.textAbs(it.z, x + 19, this.y + 56, {size: 7.5, b: true, color: COL.white}); }
        });
        this.y += h + 8;
      }
    }
    /* barra de Z-score con marcador */
    zbar(title, info, left, segs, axis){
      this.ensure(40);
      this.textAbs(title, this.x, this.y + 9, {size: 9, b: true, color: COL.ink});
      this.textAbs(info, this.x + this.w, this.y + 9, {size: 8.5, color: COL.ink2, align: 'right'});
      const by = this.y + 15, bh = 9, bw = this.w;
      this.rectAbs(this.x, by, bw, bh, {fill: '#e9e3d2', r: 4.5});
      (segs || []).forEach(s=> this.rectAbs(this.x + bw*s[0]/100, by, Math.max(bw*(s[1]-s[0])/100, 0.5), bh, {fill: s[2]}));
      const mx = this.x + bw*Math.max(0, Math.min(100, left))/100;
      this.rectAbs(mx - 1.4, by - 3, 2.8, bh + 6, {fill: COL.ink, r: 1.2});
      if(axis && axis.length){
        axis.forEach((a, i)=>{
          const px = this.x + bw*i/(axis.length - 1);
          this.textAbs(a, px, by + bh + 9, {size: 6.8, color: '#9a8a6a', align: i === 0 ? 'left' : (i === axis.length - 1 ? 'right' : 'center')});
        });
      }
      this.y = by + bh + 17;
    }
    /* tabla */
    table(sp){
      const size = sp.size || 8.2, pad = sp.pad || 4, lh = size*1.32;
      const tot = sp.cols.reduce((a, c)=>a + c.w, 0);
      const cws = sp.cols.map(c=> c.w/tot*this.w);
      /* anchos mínimos (puntos) para que códigos y números no se partan */
      if(sp.cols.some(c=> c.min)){
        for(let it = 0; it < 4; it++){
          let deficit = 0, free = 0;
          cws.forEach((w, i)=>{ const m = sp.cols[i].min || 0; if(w < m){ deficit += m - w; cws[i] = m; } });
          if(deficit <= 0) break;
          cws.forEach((w, i)=>{ const m = sp.cols[i].min || 0; if(w > m) free += w - m; });
          if(free <= 0) break;
          const k = Math.min(1, deficit/free);
          cws.forEach((w, i)=>{ const m = sp.cols[i].min || 0; if(w > m) cws[i] = w - (w - m)*k; });
        }
      }
      const norm = c => (c !== null && typeof c === 'object' && !Array.isArray(c)) ? c : {t: c};
      const prep = (row)=> row.map((c, i)=>{
        c = norm(c); const w = cws[i] - 2*pad;
        let lines = [];
        if(c.bar || c.chip) lines = [];
        else lines = this.wrap(c.runs || String(c.t == null ? '' : c.t), w, size, c.b || sp.cols[i].b);
        return {c: c, lines: lines, w: w};
      });
      const rowH = (cells)=> Math.max(sp.minH || 15, ...cells.map(x=> (x.c.bar || x.c.chip) ? 15 : x.lines.length*lh + 2*pad - 1));
      const drawHead = ()=>{
        if(!sp.head) return;
        const h = 17;
        this.ensure(h + 14);
        this.rectAbs(this.x, this.y, this.w, h, {fill: sp.headBg || COL.graphite, r: 4});
        let xx = this.x;
        sp.head.forEach((t, i)=>{
          const al = sp.cols[i].align || 'left';
          this.textAbs(t, al === 'left' ? xx + pad : (al === 'right' ? xx + cws[i] - pad : xx + cws[i]/2), this.y + 11.5, {size: size, b: true, color: COL.white, align: al});
          xx += cws[i];
        });
        this.y += h;
      };
      if(sp.keep){
        const total = (sp.head ? 17 : 0) + sp.rows.reduce((a, row)=> a + ((row && row.group) ? 18 : rowH(prep(row))), 0);
        if(this.y + total > this.H - this.bottom && total < (this.H - this.bottom) * 0.6) this.newPage();
      }
      drawHead();
      let z = 0;
      for(const row of sp.rows){
        if(row && row.group){
          this.ensure(20);
          this.rectAbs(this.x, this.y + 2, this.w, 15, {fill: '#f6e6c8', r: 3});
          this.textAbs(row.group, this.x + pad + 2, this.y + 12.5, {size: size + 0.6, b: true, color: COL.gold});
          this.y += 18; z = 0; continue;
        }
        const cells = prep(row), h = rowH(cells);
        if(this.y + h > this.H - this.bottom){ this.newPage(); drawHead(); }
        const rbg = row.bg || (sp.zebra !== false && (z % 2) ? '#faf6ea' : null);
        if(rbg) this.rectAbs(this.x, this.y, this.w, h, {fill: rbg});
        let xx = this.x;
        cells.forEach((cl, i)=>{
          const c = cl.c, al = c.align || sp.cols[i].align || 'left';
          if(c.bg) this.rectAbs(xx, this.y, cws[i], h, {fill: c.bg});
          if(c.chip){
            const st = CHIP[c.chip.k] || CHIP.gray, ts = size - 0.6, cwid = tw(sanitize(c.chip.t), ts, true) + 10;
            const cx = al === 'center' ? xx + (cws[i] - cwid)/2 : xx + pad;
            this.rectAbs(cx, this.y + (h - ts - 5)/2, cwid, ts + 5, {fill: st.bg, r: (ts + 5)/2});
            this.textAbs(c.chip.t, cx + 5, this.y + (h - ts - 5)/2 + ts + 0.6, {size: ts, b: true, color: st.fg});
          } else if(c.bar){
            const bw = cws[i] - 2*pad, by = this.y + h/2 - 3;
            this.rectAbs(xx + pad, by, bw, 6, {fill: '#ece6d4', r: 3});
            const frac = Math.max(0, Math.min(1, c.bar.pct/150));
            if(frac > 0) this.rectAbs(xx + pad, by, Math.max(bw*frac, 3), 6, {fill: c.bar.color || COL.green, r: 3});
            this.rectAbs(xx + pad + bw*(100/150) - 0.5, by - 2, 1, 10, {fill: COL.ink2});
          } else {
            const ty = this.y + pad + size*0.88 - 0.5;
            cl.lines.forEach((ln, k)=> this._line(ln, xx + pad, ty + k*lh, size, c.color || COL.ink, al, cl.w));
          }
          xx += cws[i];
        });
        this.lineAbs(this.x, this.y + h, this.x + this.w, this.y + h, {c: COL.line, lw: 0.5});
        this.y += h; z++;
      }
      this.y += 6;
    }
    /* barras horizontales (% del total) */
    hbars(items, o){
      o = o || {};
      const lw = o.labelW || 92, h = 15;
      items.forEach(it=>{
        this.ensure(h + 4);
        this.textAbs(it.label, this.x, this.y + 10.5, {size: 8.5, b: true, color: COL.ink});
        const bx = this.x + lw, bw = this.w - lw - 78;
        this.rectAbs(bx, this.y + 2, bw, 9, {fill: '#ece6d4', r: 4.5});
        const f = Math.max(0, Math.min(1, it.frac));
        if(f > 0) this.rectAbs(bx, this.y + 2, Math.max(bw*f, 4), 9, {fill: it.color || COL.orange, r: 4.5});
        this.textAbs(it.value, this.x + this.w, this.y + 10, {size: 8, color: COL.ink2, align: 'right'});
        this.y += h + 2;
      });
      this.y += 3;
    }
    /* barra apilada (macronutrientes) */
    stacked(parts){
      this.ensure(46);
      const h = 14; let x = this.x;
      const tot = parts.reduce((a, p)=>a + p.pct, 0) || 1;
      parts.forEach((p, i)=>{
        const w = this.w*p.pct/tot;
        this.rectAbs(x, this.y, w, h, {fill: p.color});
        if(w > 30) this.textAbs(p.pct + '%', x + w/2, this.y + 10.2, {size: 8, b: true, color: COL.white, align: 'center'});
        x += w;
      });
      this.y += h + 5;
      let lx = this.x;
      parts.forEach(p=>{
        this.rectAbs(lx, this.y + 2, 7, 7, {fill: p.color, r: 2});
        const t = p.label;
        this.textAbs(t, lx + 10, this.y + 8.5, {size: 8, color: COL.ink2});
        lx += 10 + tw(sanitize(t), 8, false) + 16;
      });
      this.y += 16;
    }

    /* ---------- cierre ---------- */
    finish(){
      const N = this.pages.length;
      this.pages.forEach((pg, i)=>{
        this.cur = pg;
        const fy = this.H - 24;
        this.lineAbs(this.M, fy - 9, this.W - this.M, fy - 9, {c: COL.line, lw: 0.8});
        this.textAbs('NutriAndes · Herramienta de apoyo al diagnóstico nutricional comunitario', this.M, fy, {size: 7, color: COL.muted});
        this.textAbs('Página ' + (i+1) + ' de ' + N, this.W - this.M, fy, {size: 7.5, b: true, color: COL.ink2, align: 'right'});
        if(i === N - 1 && (this.disclaimer || this.author)){
          this.textAbs(this.disclaimer, this.M, fy + 10, {size: 6.6, color: COL.muted, i: true});
          if(this.author) this.textAbs(this.author, this.W - this.M, fy + 10, {size: 6.6, color: COL.muted, align: 'right'});
        }
      });
      const objs = [];
      const add = s => { objs.push(s); return objs.length; };
      add('<< /Type /Catalog /Pages 2 0 R >>');
      add('PAGES');
      add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
      add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
      add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');
      const d = new Date(), p2 = v => String(v).padStart(2, '0');
      const ds = 'D:' + d.getFullYear() + p2(d.getMonth()+1) + p2(d.getDate()) + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds());
      add(`<< /Title (${esc(sanitize(this.title))}) /Author (NutriAndes) /Producer (NutriAndes) /Creator (NutriAndes) /CreationDate (${ds}) >>`);
      const kids = [];
      this.pages.forEach(pg=>{
        const content = pg.ops.join('\n');
        const cid = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
        const pid = add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n2(this.W)} ${n2(this.H)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${cid} 0 R >>`);
        kids.push(pid + ' 0 R');
      });
      objs[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${N} >>`;
      let out = '%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n'; const offs = [];
      objs.forEach((o, i)=>{ offs.push(out.length); out += `${i+1} 0 obj\n${o}\nendobj\n`; });
      const xr = out.length;
      out += `xref\n0 ${objs.length+1}\n0000000000 65535 f \n` + offs.map(o=> String(o).padStart(10, '0') + ' 00000 n \n').join('');
      out += `trailer\n<< /Size ${objs.length+1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xr}\n%%EOF`;
      const arr = new Uint8Array(out.length);
      for(let i = 0; i < out.length; i++) arr[i] = out.charCodeAt(i) & 255;
      return new Blob([arr], {type: 'application/pdf'});
    }
  }
  function save(doc, filename){
    const blob = doc.finish();
    nutriGuardarArchivo(filename, blob);
    return blob;
  }
  return {Doc: Doc, save: save, tw: tw, sanitize: sanitize, COL: COL, CHIP: CHIP};
})();

/* =====================================================================
   PDF de resultados: Historia clínica nutricional (antropometría) y
   Recordatorio de 24 horas con análisis químico. Sin fórmulas de cálculo.
   ===================================================================== */
const PDFX = {
  C: NutriPDF.COL,
  /* limpia texto: quita detalles de cálculo / fórmulas */
  scrub(t, brackets){
    let s = String(t == null ? '' : t);
    if(brackets) s = s.replace(/\[[^\]]*\]/g, '');
    return s.replace(/\s*\(\s*peso\s*\/\s*talla\s*[²2]\s*\)/gi, '')
            .replace(/\s*\((?:método\s+)?Holliday[-–\s]?Segar\)/gi, '')
            .replace(/\s*según (?:el )?método [^.;(\n]*/gi, '')
            .replace(/[ \t]{2,}/g, ' ');
  },
  hidden(el){
    /* oculto si el propio elemento o cualquiera de sus contenedores tiene display:none */
    try{ for(let n = el; n && n.nodeType === 1; n = n.parentElement){ if(getComputedStyle(n).display === 'none') return true; } return false; }catch(e){ return false; }
  },
  esNota(el){
    const txt = (el.textContent || '').trim();
    if(!txt) return true;
    if(/^(Referencia|Fuente|F[óo]rmula|M[ée]todo|Metodolog)/i.test(txt)) return true;
    const st = (el.getAttribute && el.getAttribute('style')) || '';
    if(/font-style:\s*italic/i.test(st) && txt.length < 500) return true;
    return false;
  },
  hasBlock(el){
    return !!el.querySelector('div,p,table,ul,ol,details,h2,h3,h4,.esq-item');
  },
  /* runs [{t,b}] a partir de un nodo */
  runsOf(node, bold, out){
    node.childNodes.forEach(n=>{
      if(n.nodeType === 3){
        const t = n.nodeValue.replace(/\s+/g, ' ');
        if(t) out.push({t: t, b: bold});
      } else if(n.nodeType === 1){
        const tag = n.tagName;
        if(/^(SCRIPT|STYLE|BUTTON|SELECT|INPUT|SVG|CANVAS)$/i.test(tag)) return;
        if(PDFX.hidden(n)) return;
        if(n.classList.contains('esq-icon')) return;
        if(tag === 'BR'){ out.push({t: '\n'}); return; }
        const block = /^(DIV|P|LI|TR|H\d|UL|OL|DETAILS|SUMMARY)$/.test(tag);
        if(block && out.length && out[out.length-1].t !== '\n') out.push({t: '\n'});
        const b = bold || tag === 'B' || tag === 'STRONG' || /font-weight:\s*(700|800|bold)/.test(n.getAttribute('style') || '');
        PDFX.runsOf(n, b, out);
        if(block) out.push({t: '\n'});
      }
    });
    return out;
  },
  clean(runs, ctx){
    const res = []; let nl = true;
    runs.forEach(r=>{
      const t = PDFX.scrub(r.t, ctx && ctx.brackets);
      if(t === '\n'){ if(!nl){ res.push({t: '\n'}); nl = true; } return; }
      if(!t.trim()){ if(!nl) res.push({t: ' ', b: r.b}); return; }
      nl = false; res.push({t: nl ? t : t, b: r.b, i: r.i, c: r.c});
    });
    while(res.length && (res[res.length-1].t === '\n' || !res[res.length-1].t.trim())) res.pop();
    return res;
  },
  runs(node, ctx){ return PDFX.clean(PDFX.runsOf(node, false, []), ctx); },

  walk(parent, d, ctx){
    ctx = ctx || {};
    let buf = [];
    const flush = ()=>{
      const r = PDFX.clean(buf, ctx); buf = [];
      if(r.length) d.para(r, {size: ctx.size || 9, color: ctx.color});
    };
    parent.childNodes.forEach(n=>{
      if(n.nodeType === 3){ buf.push({t: n.nodeValue.replace(/\s+/g, ' ')}); return; }
      if(n.nodeType !== 1) return;
      const tag = n.tagName;
      if(/^(BUTTON|SCRIPT|STYLE|SELECT|INPUT|H2|H3|SUMMARY)$/.test(tag)) return;
      if(n.classList && n.classList.contains('esq-block')){ flush(); return; }
      if(PDFX.hidden(n) || PDFX.esNota(n)) return;
      if(tag === 'B' || tag === 'STRONG'){ buf.push({t: n.textContent, b: true}); return; }
      if(tag === 'BR'){ buf.push({t: '\n'}); return; }
      if(/^(SPAN|I|EM|A|SMALL|SUB|SUP)$/.test(tag) && !PDFX.hasBlock(n)){ PDFX.runsOf(n, false, buf); return; }
      flush();
      PDFX.block(n, d, ctx);
    });
    flush();
  },
  block(n, d, ctx){
    const tag = n.tagName, cl = n.classList, C = PDFX.C;
    if(cl.contains('esq-block')) return;   /* los bloques anidados se imprimen aparte, con su título */
    if(tag === 'TABLE') return PDFX.table(n, d);
    if(cl.contains('esq-item')) return PDFX.item(n, d);
    if(cl.contains('manejo-critico')){ const r = PDFX.runs(n); if(r.length) d.callout(r, {tone: 'danger', size: 8.8}); return; }
    if(cl.contains('manejo-box') || tag === 'DETAILS') return PDFX.manejo(n, d);
    if(cl.contains('integral-box')){ const r = PDFX.runs(n, ctx); if(r.length) d.callout(r, {tone: 'warn', size: 9.2}); return; }
    if(cl.contains('alert-box')){ const r = PDFX.runs(n); if(r.length) d.callout(r, {tone: 'danger'}); return; }
    if(cl.contains('warn-inline')){ const r = PDFX.runs(n); if(r.length) d.para(r, {size: 8.2, color: C.muted, after: 4}); return; }
    if(tag === 'UL' || tag === 'OL'){
      const items = [...n.querySelectorAll(':scope > li')].map(li=> ({runs: PDFX.runs(li)})).filter(x=>x.runs.length);
      d.bullets(items, {size: ctx.size || 9}); return;
    }
    if(n.querySelector(':scope > div[style*="linear-gradient"]')) return PDFX.curve(n, d);
    if(PDFX.hasBlock(n)) return PDFX.walk(n, d, ctx);
    const r = PDFX.runs(n, ctx);
    if(r.length) d.para(r, {size: ctx.size || 9, color: ctx.color});
  },
  item(n, d){
    const C = PDFX.C, ic = (n.querySelector('.esq-icon') || {textContent: ''}).textContent.trim();
    const color = /⚠|🚨|❗/.test(ic) ? C.red : (/💊|💧/.test(ic) ? C.blue : (/✓|✔/.test(ic) ? C.green : C.orange));
    const r = PDFX.runs(n);
    if(r.length) d.bullets([{runs: r, color: color}], {size: 9});
  },
  manejo(n, d){
    const C = PDFX.C;
    let title = '', chips = [], rest = [];
    if(n.tagName === 'DETAILS'){
      const s = n.querySelector(':scope > summary'); title = s ? s.textContent.trim() : '';
      rest = [...n.children].filter(c=> c !== s);
    } else {
      const ch = [...n.children], hdr = ch[0];
      if(hdr && hdr.tagName === 'DIV' && /flex/.test(hdr.getAttribute('style') || '')){
        title = ((hdr.children[0] || {}).textContent || '').trim();
        chips = [...hdr.querySelectorAll('span')].map(s=> s.textContent.trim()).filter(Boolean);
        rest = ch.slice(1);
      } else rest = ch;
    }
    d.beginBlock({bg: '#fffdf7', line: C.line, bar: C.gold, pad: 8});
    if(title) d.para([{t: PDFX.scrub(title), b: true}], {size: 9.4, color: C.ink, after: 2});
    if(chips.length) d.para([{t: chips.join('  ·  '), b: true}], {size: 7.6, color: C.gold, after: 2});
    rest.forEach(el=>{
      if(PDFX.hidden(el) || PDFX.esNota(el)) return;
      PDFX.block(el, d, {size: 8.6});
    });
    d.endBlock();
    d.space(4);
  },
  curve(n, d){
    const C = PDFX.C;
    const hdr = n.children[0], spans = hdr ? hdr.querySelectorAll('span') : [];
    const title = spans[0] ? spans[0].textContent.trim() : '';
    const info = spans[1] ? spans[1].textContent.trim() : '';
    const g = n.querySelector('[style*="linear-gradient"]');
    const st = g.getAttribute('style') || '';
    const stops = [...st.matchAll(/(#[0-9a-fA-F]{6})\s+(\d+(?:\.\d+)?)%/g)].map(m=>[m[1], parseFloat(m[2])]);
    const segs = [];
    for(let i = 0; i < stops.length - 1; i++){
      if(stops[i][0] === stops[i+1][0] && stops[i+1][1] > stops[i][1]) segs.push([stops[i][1], stops[i+1][1], stops[i][0]]);
    }
    const mk = g.querySelector('[style*="left:"]');
    const left = mk ? parseFloat((mk.getAttribute('style').match(/left:\s*(-?[\d.]+)%/) || [0, 50])[1]) : 50;
    const last = n.children[n.children.length - 1];
    const axis = last ? [...last.querySelectorAll('span')].map(s=> s.textContent.trim()) : [];
    d.zbar(title, info, left, segs, axis.length > 1 ? axis : null);
  },
  table(n, d){
    const rows = [...n.querySelectorAll('tr')];
    if(!rows.length) return;
    let head = null; const body = [];
    rows.forEach(tr=>{
      const cells = [...tr.children];
      const isHead = tr.parentElement.tagName === 'THEAD' || (cells.length && cells.every(c=> c.tagName === 'TH'));
      if(isHead && !head){ head = cells.map(c=> PDFX.scrub(c.textContent.replace(/\s+/g, ' ').trim())); return; }
      body.push(cells.map(c=>{
        const r = PDFX.runs(c);
        const bold = c.tagName === 'TH' || /font-weight:\s*(700|800|bold)/.test(c.getAttribute('style') || '');
        return {runs: r.length ? r : [{t: '—'}], b: bold};
      }));
    });
    const nc = Math.max(head ? head.length : 0, ...body.map(r=> r.length));
    const cols = [];
    for(let i = 0; i < nc; i++){
      const lens = body.map(r=> r[i] ? r[i].runs.map(x=>x.t).join('').length : 0);
      if(head && head[i]) lens.push(head[i].length);
      const avg = lens.reduce((a, b)=>a + b, 0) / Math.max(lens.length, 1);
      let longest = 0;
      body.forEach(r=>{ if(r[i]) r[i].runs.map(x=>x.t).join('').split(/\s+/).forEach(w=>{ longest = Math.max(longest, NutriPDF.tw(NutriPDF.sanitize(w), nc > 5 ? 7.4 : 8, true)); }); });
      if(head && head[i]) head[i].split(/\s+/).forEach(w=>{ longest = Math.max(longest, NutriPDF.tw(NutriPDF.sanitize(w), nc > 5 ? 7.4 : 8, true)); });
      cols.push({w: Math.min(Math.max(avg, 6), 34), min: Math.min(longest + 11, 90), align: (i > 0 && avg <= 12) ? 'center' : 'left'});
    }
    d.table({cols: cols, head: head && head.length === nc ? head : null, rows: body.map(r=>{ while(r.length < nc) r.push({t: ''}); return r; }),
             size: nc > 5 ? 7.4 : 8, zebra: true});
  }
};

/* ---------- Historia clínica nutricional (antropometría) ---------- */
function descargarHistoriaPDF(){
  if(typeof ultimoReporte === 'undefined' || !ultimoReporte){ alert('No hay evaluación para descargar. Calcule primero el diagnóstico.'); return; }
  const r = ultimoReporte, C = PDFX.C;
  const d = new NutriPDF.Doc({
    title: 'Historia clínica nutricional', running: 'Paciente: ' + r.nombre,
    disclaimer: 'Documento de apoyo al diagnóstico nutricional comunitario. No sustituye la valoración clínica presencial del personal de salud.',
    author: 'NutriAndes · Bolivia'
  });
  d.hero({title: 'Historia clínica nutricional', sub: 'Diagnóstico nutricional integral', sub2: 'Ministerio de Salud y Deportes · Estado Plurinacional de Bolivia',
          right: 'FECHA DE EVALUACIÓN\n' + r.fecha});

  d.heading('Datos del paciente');
  const lab = t=> ({t: t, b: true, color: C.muted, bg: C.soft});
  d.table({cols: [{w: 16}, {w: 34}, {w: 16}, {w: 34}], zebra: false, size: 8.6, rows: [
    [lab('Paciente'), {t: r.nombre, b: true}, lab('Sexo'), r.sexo === 'M' ? 'Masculino' : 'Femenino'],
    [lab('Edad'), r.edadStr || '—', lab('Grupo etario'), r.grupoTxt || '—'],
    [lab('Comorbilidad'), r.comorbilidadTxt || 'Ninguna', lab('Responsable'), r.responsable || 'No registrado'],
    [lab('Establecimiento'), r.establecimiento || 'No registrado', lab('Fecha'), r.fecha || '—']
  ]});
  const num = v => (v === undefined || v === null || v === '' || (typeof v === 'number' && isNaN(v))) ? '—' : String(v);
  const kv = (v, u)=>{ const n = num(v); if(n === '—') return '—'; return /^-?\d+([.,]\d+)?$/.test(n) ? n + ' ' + u : n; };
  const kp = [
    {label: 'Peso', value: kv(r.peso, 'kg'), color: C.orange},
    {label: 'Talla', value: kv(r.talla, 'cm'), color: C.blue}
  ];
  if(/\d/.test(kv(r.pc, 'cm'))) kp.push({label: 'Perímetro cefálico', value: kv(r.pc, 'cm'), color: C.green});   /* solo si se registró */
  d.kpis(kp, kp.length);

  if(r.alertas && r.alertas.length){
    const runs = []; r.alertas.forEach((a, i)=>{ if(i) runs.push({t: '\n'}); runs.push({t: '• ' + PDFX.scrub(String(a).replace(/<[^>]+>/g, ''))}); });
    d.callout(runs, {tone: 'danger', title: 'Alertas clínicas', size: 8.8});
  }

  const cards = [...document.querySelectorAll('#r-indicadores .diag-card')].map(c=>{
    const q = s=> { const e = c.querySelector(s); return e ? e.textContent.trim() : ''; };
    const k = ['green', 'yellow', 'red', 'blue', 'orange'].find(x=> c.classList.contains(x)) || 'gray';
    return {title: q('.diag-title'), value: q('.diag-value'), sub: q('.diag-sub'), z: q('.zscore'), k: k};
  });
  if(cards.length){ d.heading('Resultados antropométricos (OMS)'); d.cards(cards, 2); }

  document.querySelectorAll('#result .esq-block').forEach(b=>{
    if(PDFX.hidden(b)) return;
    const h = b.querySelector(':scope > h3');
    const title = PDFX.scrub(h ? h.textContent : '').replace(/\s+/g, ' ').trim();
    if((b.innerText || '').replace(title, '').trim().length < 3) return;
    d.heading(title);
    PDFX.walk(b, d, {size: 9, brackets: !!b.querySelector('#r-integral')});
  });

  NutriPDF.save(d, 'historia_nutricional_' + String(r.nombre || 'paciente').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\-]+/g, '_') + '.pdf');
}

/* ---------- Recordatorio de 24 horas y análisis químico ---------- */
function r24DescargarPDF(){
  r24ActualizarComp();
  const C = PDFX.C;
  if(!r24Get){ alert('Complete peso, talla, edad y sexo para calcular el gasto energético antes de descargar el PDF.'); return; }
  const g = id => { const e = document.getElementById(id); return e ? e.value : ''; };
  const sel = id => { const e = document.getElementById(id); return e && e.selectedOptions[0] ? e.selectedOptions[0].text : ''; };
  const nombre = g('r24_nombre').trim() || 'Paciente';
  const t = r24Totales(), macros = r24LeerMacros(), est = r24EstadoFisio();
  const pesoN = r24PF(g('r24_peso')), sexo = g('r24_sexo');
  const fmt = (v, dec) => (v === undefined || v === null || isNaN(v)) ? '—' : Number(v).toFixed(dec);
  const fecha = new Date().toLocaleDateString('es-BO');

  const d = new NutriPDF.Doc({
    title: 'Recordatorio de 24 horas y análisis químico', running: 'Paciente: ' + nombre,
    disclaimer: 'Documento de apoyo. No sustituye la valoración clínica presencial del personal de salud.',
    author: 'NutriAndes · Bolivia'
  });
  d.hero({title: 'Recordatorio de 24 horas', sub: 'Análisis químico y comparación con el requerimiento', sub2: 'Diagnóstico nutricional integral · NutriAndes', right: 'FECHA\n' + fecha});

  /* 1. Paciente */
  d.heading('Datos del paciente');
  const lab = x=> ({t: x, b: true, color: C.muted, bg: C.soft});
  const meses = g('r24_edad_meses');
  const edadTxt = (g('r24_edad') || '0') + ' años' + (meses && +meses ? ' ' + meses + ' meses' : '');
  let estTxt = 'No aplica';
  if(est.emb || est.lact){
    const p = [];
    if(est.emb) p.push('Embarazada (' + sel('r24_trimestre').split(' (')[0] + ')');
    if(est.lact) p.push('En lactancia (' + sel('r24_lact_per') + ')');
    estTxt = p.join(' + ');
  }
  d.table({cols: [{w: 17}, {w: 33}, {w: 17}, {w: 33}], zebra: false, size: 8.6, rows: [
    [lab('Paciente'), {t: nombre, b: true}, lab('Sexo'), sexo === 'M' ? 'Masculino' : 'Femenino'],
    [lab('Edad'), edadTxt, lab('Peso / Talla'), fmt(pesoN, 1) + ' kg · ' + fmt(r24PF(g('r24_talla')), 1) + ' cm'],
    [lab('Actividad (NAF)'), sel('r24_naf') || '—', lab('Factor de injuria'), sel('r24_injuria') || '—'],
    [lab('Estado fisiológico'), estTxt, lab('Requerimientos'), (window.r24MicroActual && window.r24MicroActual._g) || '—']
  ]});

  /* 2. Energía y macronutrientes */
  d.heading('Necesidades de energía y macronutrientes');
  const agua = window.r24AguaActual || {ml: 0};
  d.kpis([
    {label: 'Gasto energético basal', value: fmt(r24Geb, 0) + ' kcal', color: C.blue},
    {label: 'Gasto energético total', value: fmt(r24Get, 0) + ' kcal', color: C.orange},
    {label: 'Agua recomendada', value: fmt(agua.ml, 0) + ' ml', color: C.green}
  ], 3);
  const extra = r24KcalExtra();
  if(extra.kcal > 0){
    const baseSin = (window.r24GetBase || r24Get) - extra.kcal;
    d.callout([{t: 'Energía aumentada por estado fisiológico: ', b: true}, {t: '+' + extra.kcal + ' kcal/día por ' + extra.partes.map(p=> p.replace(/:\s*\+?\d+ kcal\/día$/, '')).join(' + ') + '. Energía sin este aumento: ' + fmt(baseSin, 0) + ' kcal; con aumento: ' + fmt(window.r24GetBase || r24Get, 0) + ' kcal/día.'}],
      {tone: 'warn', size: 8.8});
  }
  const gP = r24Get * macros.p/100/4, gC = r24Get * macros.c/100/4, gF = r24Get * macros.f/100/9;
  d.stacked([
    {label: 'Proteína ' + macros.p + '%', pct: macros.p, color: C.blue},
    {label: 'Carbohidratos ' + macros.c + '%', pct: macros.c, color: C.orange},
    {label: 'Grasas ' + macros.f + '%', pct: macros.f, color: C.green}
  ]);
  d.kpis([
    {label: 'Proteína', value: fmt(gP, 1) + ' g', sub: pesoN ? fmt(gP/pesoN, 2) + ' g/kg' : '', color: C.blue},
    {label: 'Carbohidratos', value: fmt(gC, 1) + ' g', color: C.orange},
    {label: 'Grasas', value: fmt(gF, 1) + ' g', color: C.green}
  ], 3);

  /* 3. Alimentos consumidos por tiempo de comida */
  d.heading('Alimentos consumidos por tiempo de comida');
  if(!r24Lista.length){
    d.callout([{t: 'No se registraron alimentos en este recordatorio.'}], {tone: 'note'});
  } else {
    const pal = [C.orange, C.blue, C.green, '#9b59b6', C.gold, C.red];
    const porComida = [];
    R24_COMIDAS.forEach((com, ci)=>{
      const items = r24Lista.filter(x=> (x.comida || 'desayuno') === com.id);
      if(!items.length) return;
      const sum = k => items.reduce((a, x)=> a + (x[k] || 0), 0);
      const kc = sum('kcal');
      porComida.push({label: com.label, kcal: kc, color: pal[ci % pal.length]});
      d.ensure(Math.min(60 + items.length*17, 330));   /* título + tabla de la comida juntos */
      d.subheading(com.label + ' · ' + fmt(kc, 0) + ' kcal (' + fmt(t.kcal ? kc/t.kcal*100 : 0, 0) + '% del día)', pal[ci % pal.length]);
      const rows = items.map(x=> [{t: x.n}, fmt(x.cant, 0), fmt(x.kcal, 0), fmt(x.prot, 1), fmt(x.ch, 1), fmt(x.fat, 1), fmt(x.fib, 1)]);
      rows.push([{t: 'Subtotal', b: true, bg: '#f6e6c8'}, {t: fmt(sum('cant'), 0), b: true, bg: '#f6e6c8'}, {t: fmt(kc, 0), b: true, bg: '#f6e6c8'},
        {t: fmt(sum('prot'), 1), b: true, bg: '#f6e6c8'}, {t: fmt(sum('ch'), 1), b: true, bg: '#f6e6c8'}, {t: fmt(sum('fat'), 1), b: true, bg: '#f6e6c8'}, {t: fmt(sum('fib'), 1), b: true, bg: '#f6e6c8'}]);
      d.table({cols: [{w: 40}, {w: 8, align: 'center'}, {w: 9, align: 'center'}, {w: 9, align: 'center'}, {w: 9, align: 'center'}, {w: 9, align: 'center'}, {w: 9, align: 'center'}],
               head: ['Alimento', 'g', 'kcal', 'Prot (g)', 'CH (g)', 'Grasa (g)', 'Fibra (g)'], rows: rows, size: 8, keep: true});
    });
    d.subheading('Total del día', C.ink);
    d.kpis([
      {label: 'Energía', value: fmt(t.kcal, 0) + ' kcal', color: C.orange}, {label: 'Proteína', value: fmt(t.prot, 1) + ' g', color: C.blue},
      {label: 'Carbohidratos', value: fmt(t.ch, 1) + ' g', color: C.orange}, {label: 'Grasas', value: fmt(t.fat, 1) + ' g', color: C.green},
      {label: 'Fibra', value: fmt(t.fib, 1) + ' g', color: C.gold}
    ], 5);
    if(porComida.length > 1 && t.kcal > 0){
      d.subheading('Aporte de energía por tiempo de comida', C.gold);
      d.hbars(porComida.map(p=> ({label: p.label, frac: p.kcal/t.kcal, color: p.color, value: fmt(p.kcal, 0) + ' kcal · ' + fmt(p.kcal/t.kcal*100, 0) + '%'})));
    }
  }

  /* 4. Comparación consumo vs requerimiento */
  d.heading('Comparación consumo vs requerimiento');
  const filas = window.r24FilasComp || [];
  const KC = {green: C.green, yellow: C.yellow, red: C.red, orange: C.orange};
  const grupos = [
    ['Energía, macronutrientes y agua', ['kcal', 'prot', 'ch', 'fat', 'AGUA']],
    ['Ácidos grasos, colesterol y fibra', ['ags', 'agm', 'agp', 'col', 'fib']],
    ['Minerales', ['ca', 'p', 'fe', 'na', 'k', 'zn', 'cu', 'mg', 'se']],
    ['Vitaminas', ['ret', 'b1', 'b2', 'b3', 'fol', 'b12', 'vc', 'vd', 've', 'vk']]
  ];
  const rows = [];
  grupos.forEach(gp=>{
    const lista = gp[1].map(k=> filas.find(f=> k === 'AGUA' ? /^Agua/.test(f.n) : f.k === k)).filter(Boolean);
    if(!lista.length) return;
    rows.push({group: gp[0]});
    lista.forEach(row=>{
      const esAgua = /^Agua/.test(row.n);   /* el consumo de agua no se obtiene de los alimentos registrados */
      const pct = row.r > 0 ? row.c/row.r*100 : 0;
      const inter = esAgua ? {t: 'Sin dato', c: 'gray'} : (row.r > 0 ? r24Interp(pct) : (row.c > 0 ? {t: 'Registrado', c: 'blue'} : {t: 'Sin dato', c: 'gray'}));
      const dec = /kcal|Energ|^Agua/.test(row.n) ? 0 : (Math.max(row.r, row.c) >= 10 ? 1 : 2);
      const nombreFila = /^Agua/.test(row.n) ? 'Agua total (ml)' : row.n;
      rows.push([
        {t: nombreFila, b: true},
        {t: row.c > 0 ? row.c.toFixed(dec) : '—', align: 'center'},
        {t: row.r ? row.r.toFixed(dec) : '—', align: 'center'},
        (row.r > 0 && !esAgua) ? {bar: {pct: pct, color: KC[inter.c] || C.green}} : {t: ''},
        {t: (row.r && !esAgua) ? pct.toFixed(0) + '%' : '—', align: 'center', b: true},
        {chip: {t: inter.t, k: inter.c}, align: 'center'}
      ]);
    });
  });
  d.table({cols: [{w: 30}, {w: 10, align: 'center'}, {w: 10, align: 'center'}, {w: 18}, {w: 8, align: 'center'}, {w: 15, align: 'center'}],
           head: ['Parámetro', 'Consumido', 'Requerido', '% de adecuación', '%', 'Interpretación'], rows: rows, size: 8, minH: 16});
  /* leyenda */
  d.ensure(24);
  let lx = d.x;
  [['Deficiente', 'red', '< 70%'], ['Bajo', 'yellow', '70–89%'], ['Adecuado', 'green', '90–110%'], ['Alto', 'yellow', '111–130%'], ['Excesivo', 'orange', '> 130%']].forEach(l=>{
    const w = d.chip(l[0] + ' ' + l[2], lx, d.y, {k: l[1], size: 7}); lx += w + 6;
  });
  d.y += 18;
  const nota = document.getElementById('r24_fis_nota');
  if(nota && nota.textContent.trim() && (est.emb || est.lact)){
    d.callout([{t: nota.textContent.trim()}], {tone: 'info', size: 8.2, title: 'Nota sobre embarazo / lactancia'});
  }
  NutriPDF.save(d, 'recordatorio_24h_' + nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\-]+/g, '_') + '.pdf');
}
