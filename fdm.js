function syncUsernameColor() {
  var cw = document.getElementById('usernameColor'), ct = document.getElementById('usernameColorText');
  ct.value = cw.value;
}
function syncUsernameColorText() {
  var cw = document.getElementById('usernameColor'), ct = document.getElementById('usernameColorText');
  if(/^#([0-9A-F]{3}){1,2}$/i.test(ct.value)) { cw.value = ct.value; }
}
function syncReplyUsernameColor() {
  var cw = document.getElementById('replyUsernameColor'), ct = document.getElementById('replyUsernameColorText');
  ct.value = cw.value;
}
function syncReplyUsernameColorText() {
  var cw = document.getElementById('replyUsernameColor'), ct = document.getElementById('replyUsernameColorText');
  if(/^#([0-9A-F]{3}){1,2}$/i.test(ct.value)) { cw.value = ct.value; }
}
document.getElementById('usernameColor').addEventListener('input', function(){ syncUsernameColor(); updatePreview(); });
document.getElementById('usernameColorText').addEventListener('input', function(){ syncUsernameColorText(); updatePreview(); });
document.getElementById('replyUsernameColor').addEventListener('input', function(){ syncReplyUsernameColor(); updatePreview(); });
document.getElementById('replyUsernameColorText').addEventListener('input', function(){ syncReplyUsernameColorText(); updatePreview(); });
function convertMentions(text, bg) {
  var mBg, mText;
  if(bg === "#000000"){ mBg = "#29274C"; mText = "#CACCFC"; }
  else if(bg === "#1C1D23"){ mBg = "#3B3B63"; mText = "#C9CDFB"; }
  else if(bg === "#ffffff"){ mBg = "#E7E9FD"; mText = "#525EDC"; }
  return text.replace(/<<([\s\S]+?)>>/g, function(m, p1){ return '<span class="mention" style="background-color:'+mBg+'; color:'+mText+';">'+p1.trim()+'</span>'; });
}
function updateTimeDisplay(bg) {
  var opt = document.querySelector('input[name="timeOption"]:checked').value, ts = "";
  if(opt === "today"){ ts = "Today at " + document.getElementById('timeToday').value + " " + document.getElementById('ampmToday').value; }
  else if(opt === "yesterday"){ ts = "Yesterday at " + document.getElementById('timeToday').value + " " + document.getElementById('ampmToday').value; }
  else { var d = document.getElementById('customDate').value || "Custom Date"; ts = d + " at " + document.getElementById('timeCustom').value + " " + document.getElementById('ampmCustom').value; }
  document.getElementById('timestampPreview').textContent = ts;
}
function updateTimeInputs() {
  var opt = document.querySelector('input[name="timeOption"]:checked').value;
  document.getElementById('todayInputs').style.display = (opt==="custom") ? "none" : "block";
  document.getElementById('customInputs').style.display = (opt==="custom") ? "block" : "none";
}
function updateReplyPreview() {
  var enable = document.getElementById('enableReply').checked;
  var replyContainer = document.getElementById('replyPreview');
  if(!enable) { replyContainer.style.display = "none"; return; }
  replyContainer.style.display = "block";
  var rpfp = document.getElementById('replyPfpInput'), rav = document.getElementById('replyAvatarPreview');
  if(rpfp.files && rpfp.files[0]){
    var r = new FileReader();
    r.onload = function(e){ rav.src = e.target.result; updatePreview(); }
    r.readAsDataURL(rpfp.files[0]);
  } else { rav.src = 'https://via.placeholder.com/32'; }
  var runame = document.getElementById('replyUsernameInput').value || "ReplyUser";
  var rucolor = document.getElementById('replyUsernameColor').value;
  document.getElementById('replyUsernamePreview').textContent = runame;
  document.getElementById('replyUsernamePreview').style.color = rucolor;
  var rmsg = document.getElementById('replyMessageInput').value;
  document.getElementById('replyMessagePreview').innerHTML = convertMentions(rmsg, getCurrentBg());
}
function getCurrentBg() {
  var bgRadios = document.getElementsByName('bgMode'), bg = "#1C1D23";
  Array.prototype.forEach.call(bgRadios, function(r){ if(r.checked) bg = r.value; });
  return bg;
}
function updatePreview() {
  var pfp = document.getElementById('pfpInput'), av = document.getElementById('avatarPreview');
  if(pfp.files && pfp.files[0]){
    var r = new FileReader();
    r.onload = function(e){ av.src = e.target.result; }
    r.readAsDataURL(pfp.files[0]);
  } else { av.src = 'https://via.placeholder.com/48'; }
  var uname = document.getElementById('usernameInput').value || "Username",
      ucolor = document.getElementById('usernameColor').value;
  document.getElementById('usernamePreview').textContent = uname;
  document.getElementById('usernamePreview').style.color = ucolor;
  var bg = getCurrentBg();
  var prev = document.getElementById('previewArea');
  prev.classList.remove('bg-gray','bg-midnight','bg-light');
  if(bg==="#1C1D23"){ prev.classList.add('bg-gray'); }
  else if(bg==="#000000"){ prev.classList.add('bg-midnight'); }
  else if(bg==="#ffffff"){ prev.classList.add('bg-light'); }
  updateTimeDisplay(bg);
  var msgRaw = document.getElementById('messageInput').value;
  document.getElementById('messagePreview').innerHTML = convertMentions(msgRaw, bg);
  var msgText = document.getElementById('messagePreview');
  if(bg==="#ffffff"){ msgText.style.color = "#000"; }
  else { msgText.style.color = "#fff"; }
  if(document.getElementById('pingMessage').checked){
    var bubble = document.querySelector('.discord-message');
    if(bg==="#000000"){ bubble.style.backgroundColor = "#130F04"; }
    else if(bg==="#1C1D23"){ bubble.style.backgroundColor = "#2E2A25"; }
    else if(bg==="#ffffff"){ bubble.style.backgroundColor = "#FDF7EA"; }
  } else {
    document.querySelector('.discord-message').style.backgroundColor = "transparent";
  }
  updateReplyPreview();
}
document.getElementById('pfpInput').addEventListener('change', updatePreview);
document.getElementById('usernameInput').addEventListener('input', updatePreview);
document.getElementById('messageInput').addEventListener('input', updatePreview);
var bgRadios = document.getElementsByName('bgMode');
Array.prototype.forEach.call(bgRadios, function(r){ r.addEventListener('change', updatePreview); });
var timeOpts = document.getElementsByName('timeOption');
Array.prototype.forEach.call(timeOpts, function(r){ r.addEventListener('change', function(){ updateTimeInputs(); updatePreview(); }); });
document.getElementById('timeToday').addEventListener('input', updatePreview);
document.getElementById('ampmToday').addEventListener('change', updatePreview);
document.getElementById('customDate').addEventListener('input', updatePreview);
document.getElementById('timeCustom').addEventListener('input', updatePreview);
document.getElementById('ampmCustom').addEventListener('change', updatePreview);
document.getElementById('pingMessage').addEventListener('change', updatePreview);
document.getElementById('enableReply').addEventListener('change', function(){
  var rc = document.getElementById('replyControls');
  rc.style.display = this.checked ? "block" : "none";
  updatePreview();
});
document.getElementById('replyPfpInput').addEventListener('change', updatePreview);
document.getElementById('replyUsernameInput').addEventListener('input', updatePreview);
document.getElementById('replyMessageInput').addEventListener('input', updatePreview);
updatePreview();
document.getElementById('exportBtn').addEventListener('click', function(){
  var prev = document.getElementById('previewArea'), clone = prev.cloneNode(true);
  clone.style.display = "inline-block"; clone.style.margin = "0"; clone.style.padding = "0"; clone.style.position = "absolute"; clone.style.top = "-9999px";
  document.body.appendChild(clone);
  html2canvas(clone).then(function(canvas){
    document.body.removeChild(clone);
    var link = document.createElement('a');
    link.download = 'discord-message.png';
    link.href = canvas.toDataURL();
    link.click();
  });
});