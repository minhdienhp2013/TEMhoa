'use strict';

/* Move live actions, keeping their handlers and keyboard shortcuts. */
const compactInsertTools=document.createElement('div');compactInsertTools.id='compactInsertTools';compactInsertTools.setAttribute('role','group');compactInsertTools.setAttribute('aria-label','Thêm nội dung');
for(const id of ['designAddText','designAddImage','insertGraphics','studioResources']){const b=$(id);if(b){compactInsertTools.append(b);}}
document.querySelector('.wordWorkspace').append(compactInsertTools);
// Keyboard/native paste stays active; the redundant visible button is removed.
$('systemPaste').hidden=true;$('systemPaste').inert=true;document.body.append($('systemPaste'));
