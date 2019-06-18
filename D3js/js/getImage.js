
function getDisplayImage(){
 //html2canvas実行
 html2canvas(document.getElementById("right-component")).then(function(canvas) {
 downloadImage(canvas.toDataURL());
 });
 }
 
 function downloadImage (data) {
 var fname ="testimage.png";
 var encdata= atob(data.replace(/^.*,/, ''));
 var outdata = new Uint8Array(encdata.length);
 for (var i = 0; i < encdata.length; i++) {
 outdata[i] = encdata.charCodeAt(i);
 }
 var blob = new Blob([outdata], ["image/png"]);
 
 if (window.navigator.msSaveBlob) {
 //IE用
	window.navigator.msSaveOrOpenBlob(blob, fname);
 } else {
 //それ以外？
	 document.getElementById("getImage").href=data; //base64そのまま設定
	 document.getElementById("getImage").download=fname; //ダウンロードファイル名設定
	 //document.getElementById("getImage").click(); //自動クリック
 }
 }