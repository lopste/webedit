"use strict";
function $(qry){return document.querySelector(qry)}

const util = {
  "longestString": (arr) => arr.reduce((a, b) => a.length > b.length ? a : b),
  "spliceString": function(str, index, count, add) {
    if (index < 0) {
      index = str.length + index;
      if (index < 0) {
        index = 0;
      }
    }
    return str.slice(0, index) + (add || "") + str.slice(index + count);
  },
  "getScrollbarWidth": function() {
    return window.innerWidth - document.documentElement.clientWidth;
  }
}

const editor = {
  "element": null,
  "canvas": null,
  "ctx": null,
  "font": "15px monospace",
  "content": {
    "text": "Hello,\nWorld!",
    "lines": 1,
    "columns": 6,
    "spaceLeft": 2,
    "scrollLeft": 0
  },
  "style": {
    "text": "#fff",
    "lineNum": "#004cbb",
    "lineHighlight": "#20303d",
    "highlight": "#008cff",
    "background": "#10202d"
  },
  "caret": {
    "line": 0,
    "column": 0,
    "visible": true,
    "blink": false,
    "moveTo": function(e,l,c,moveUp = false) {
      editor.caret.blink = false;
      clearInterval(interval)
      interval = setInterval(() => {
        editor.caret.blink = !editor.caret.blink;
        editor.draw(editor)
      }, 700)
      let line = l, colu = c
      let split = e.content.text.split("\n");
      if(line < 0) {
        colu = 0;
        line = 0;
      }
      if(line > e.content.lines - 1) {
        line = e.content.lines - 1
        colu = split[line].length
      }
      if(colu > split?.[line]?.length && !moveUp) {
        if(line <= e.content.lines) {
          colu = 0;
          line++;
        } else {
          colu--;
        }
      } else if (colu > split?.[line]?.length && !moveUp) {
        colu = split[line].length;
      } else if (colu > split?.[line]?.length) {
        colu = split[line].length;
      }
      if(colu < 0) {
        if(!(line - 1 < 0)) {
          colu = split[line - 1].length
          line--;
        } else {
          colu = 0;
        }
      }

      // catch
      if(line > e.content.lines - 1) {
        line = e.content.lines - 1
        colu = split[line].length
      }

      e.caret.line = line, e.caret.column = colu;
      e.draw(e)
    },
    "scrollTo": function(e) {
      let caretPos = e.caret
      
      e.draw(e)
    }
  },
  "draw": function(e) {
    let split = e.content.text.split("\n");
    
    let y;
    let referenceX = e.ctx.measureText(" ").width

    e.content.spaceLeft = String(split.length).length + 1;
    e.canvas.width = (referenceX * e.content.spaceLeft) + (referenceX * (util.longestString(split).length + 5)),
      e.canvas.height = (split.length * 18) + 2;

    e.ctx.fillStyle = e.style.lineHighlight, 
      e.ctx.font = e.font,
      e.ctx.textBaseline = "top";
    
    if(e.caret.visible) {
      e.ctx.fillRect(0, (e.caret.line * 18) - 2, e.canvas.width, 18)
    }

    y = 0;
    
    e.ctx.fillStyle = e.style.text;
    for(let i = 0; i < split.length; i++) {
      e.ctx.fillText(split[i], (referenceX * e.content.spaceLeft), y)
      y += 18;
    }

    if(e.caret.visible && !e.caret.blink) {
     e.ctx.fillStyle = e.style.highlight;
      if(!e.caret.blink) {
        e.ctx.fillRect(referenceX * e.caret.column + referenceX * editor.content.spaceLeft, e.caret.line * 18, 2, 13)
      }
    }
    y = 0;

    e.ctx.fillStyle = e.style.background;
    for(let i = 0; i < split.length; i++) {
      e.ctx.fillRect(e.content.scrollLeft - (referenceX * 5), y, (referenceX * e.content.spaceLeft) + (referenceX * 5), 18)
      y += 18;
    }
    
    y = 0;
    
    e.ctx.fillStyle = e.style.lineNum;
    for(let i = 0; i < split.length; i++) {
      e.ctx.fillText(
        `${"|".repeat((e.content.spaceLeft - 1) - String(i + 1).length)}${i+1}`, e.content.scrollLeft, y
      )
      y += 18;
    }
  },
  "updateContent": function(e, content) {
    e.content.text = content;
    let split = e.content.text.split("\n");
    e.content.lines = split.length;
    e.content.columns = util.longestString(split).length;

    e.draw(e)
  },
  "updateScroll": function(e, scroll) {
    e.content.scrollLeft = scroll;
    e.draw(e);
  }
}

let interval
interval = setInterval(() => {
  editor.caret.blink = !editor.caret.blink;
  editor.draw(editor)
}, 700)

function keysEditor(e) {
  e.preventDefault();
  let split = editor.content.text.split("\n");
  // sense arrows
  switch(e.key) {
    case "ArrowLeft":
      editor.caret.moveTo(editor,
        editor.caret.line,
        editor.caret.column-1);
      return;
    case "ArrowRight":
      editor.caret.moveTo(editor,
        editor.caret.line,
        editor.caret.column+1);
      return;
    case "ArrowDown":
      editor.caret.moveTo(editor,
        editor.caret.line+1,
        editor.caret.column, true);
      return;
    case "ArrowUp":
      editor.caret.moveTo(editor,
        editor.caret.line-1,
        editor.caret.column, true);
      return;
    case "Backspace":
      if(editor.caret.column == 0) {
        if(editor.caret.line == 0) return;
        editor.caret.column = split[editor.caret.line - 1].length
        split[editor.caret.line - 1] = split[editor.caret.line - 1].concat(split[editor.caret.line]);
        split.splice(editor.caret.line, 1)
        editor.caret.line--;
        editor.updateContent(editor, split.join("\n"))
        return;
      }
      
      let str = split[editor.caret.line]
      str = util.spliceString(str, editor.caret.column - 1, 1)
      split[editor.caret.line] = str;
      editor.caret.column--;
      if(editor.caret.column < 0) editor.caret.column = 0
      editor.updateContent(editor, split.join("\n"))
      return;
    case "Delete":
      return;
    case "Shift":
      return;
    case "Enter":
      let line = split[editor.caret.line]
      let newStr = line.substring(editor.caret.column);
      line = line.substring(0, editor.caret.column);
      split[editor.caret.line] = line
      split.splice(editor.caret.line + 1, 0, newStr)
      editor.updateContent(editor, split.join("\n"))
      editor.caret.moveTo(editor, editor.caret.line + 1, 0)
      return;
    case "Tab":
      split[editor.caret.line] = util.spliceString(split[editor.caret.line], editor.caret.column, 0, " ".repeat(2));
      editor.updateContent(editor, split.join("\n"))
      editor.caret.moveTo(editor,
        editor.caret.line,
        editor.caret.column+2);
      return;
    case "Control":
      return;
    case "Meta":
      return;
    case "Alt":
      return;
  }
  if(e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case "v":
        break;
    }
    return;
  }
  editor.caret.blink = false;
  clearInterval(interval)
  interval = setInterval(() => {
    editor.caret.blink = !editor.caret.blink;
    editor.draw(editor)
  }, 700)
  
  split[editor.caret.line] = util.spliceString(split[editor.caret.line], editor.caret.column, 0, e.key);
  editor.updateContent(editor, split.join("\n"))
  editor.caret.moveTo(editor,
        editor.caret.line,
        editor.caret.column+1);
}

function setup() {
  editor.element = $("#editor"),
    editor.canvas = $("#editor-canvas"),
    editor.ctx = editor.canvas.getContext("2d");

  editor.element.addEventListener("mousedown", (e) => {
    let reference = editor.ctx.measureText(" ").width
    let line = Math.floor(e.offsetY / 18);
    let column = Math.round((e.offsetX - reference * editor.content.spaceLeft) / reference) ;
    editor.caret.moveTo(editor, line, column, true)
  })

  editor.element.addEventListener("blur", () => {
    editor.caret.visible = false;
    editor.draw(editor)
  })

  editor.element.addEventListener("focus", () => {
    editor.caret.visible = true;
    editor.draw(editor)
  })

  editor.element.addEventListener("scroll", () => {
    let refX = editor.ctx.measureText(" ").width
    requestAnimationFrame(() => {
      let leftCalc = ((editor.element.scrollLeft - 15) / refX)
      editor.element.scrollTop = 
        Math.round((editor.element.scrollTop - 15) / 18) * 18 + 15
      editor.element.scrollLeft = 
        Math.round((leftCalc * refX) + 15)
      editor.updateScroll(editor, (leftCalc * refX) + 15)
    })
  })

  editor.element.setAttribute("tabindex", "0")
  editor.element.addEventListener("keydown", (e) => {
    if(editor.mode )keysEditor()
  })
  editor.updateContent(editor, 
`Web Edit

A terminal-like text editor for the web

Arrow keys or click to move the cursor
Type normally to type in things

Keybinds:
  ^S: Save the file
  ^N: Make a new file
  ^O: Open a file`)
  editor.draw(editor)
}

document.addEventListener("readystatechange", () => {
  if(document.readyState == "interactive") setup()
})