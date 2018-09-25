'use strict';

let localStream = null;
let peer = null;
let existingCall = null;

// 音声・映像をデバイスから取得
// これどっちかをtrueにしないと、errorが返るので注意
navigator.mediaDevices.getUserMedia({video: false, audio: true})
    .then(stream => {
        // Success
        $('#my-video').get(0).srcObject = stream;
        localStream = stream;
    }).catch(error => {
        // Error
        console.error('mediaDevice.getUserMedia() error:', error);
        return;
    });

// SkyWayのシグナリングサーバーと接続する
peer = new Peer({
    key: '3e476ddb-1eff-4488-b7f4-ab48065bcf42',
    debug: 3
});

// 成功するとopenイベントが発火
// PeerIDとは、イメージ的には電話番号みたいなもの.
// PeerIDと呼ばれるクライアント識別用のIDが
// シグナリングサーバで発行され、
// コールバックイベントで取得できる。
// PeerIDはクライアントサイドで指定することもできる。
// 以下の処理では、PeerIDが発行されたら、
// その情報をUIに表示する処理を行っている。
peer.on('open', ()=>{
    $('#my-id').text(peer.id);
});

// エラー処理
peer.on('error', err=>{
    alert(err.message);
});

// 接続が切れたときの処理
peer.on('close', ()=>{
    alert("接続が切れました");
});

//発信ボタンをクリックした場合に相手に発信。
//peer.call()で相手のPeerID、
//自分自身のlocalStreamを引数にセットし発信する。
//接続するための相手のPeerIDは、
//別途何らかの方法で入手する必要があるので注意。
//発信後はCallオブジェクトが返ってくるため、
//必要なイベントリスナーをセットする。
$('#make-call').submit(e=>{
    e.preventDefault(); // ?
    const call = peer.call($('#callto-id').val(), localStream);
    setupCallEventHandlers(call);
});

//切断ボタンをクリックした場合に、相手との接続を切断する。 
//call.close()で該当する接続を切断。
//発信処理で生成したCallオブジェクトは
//existingCallとして保持しておく。
//オブジェクト保持は発信処理のsetupCallEventHandlers()
//の中で実行している。
$('#end-call').click(()=>{
    existingCall.close();
});

// 相手から接続要求がきた場合に応答する。 
// 相手から接続要求が来た場合はcallが発火。 
// 引数として相手との接続を管理するためのCallオブジェクトが取得できるため、
// call.answer()を実行し接続要求に応答する。
// この時に、自分自身のlocalStreamをセットすると、
// 相手にカメラ映像・マイク音声を送信することができるようになる。
// 発信時の処理と同じくsetupCallEventHandlersを実行し、
// Callオブジェクトのイベントリスナーをセットする。
peer.on('call', call=>{
    call.answer(localStream);
    setupCallEventHandlers(call);
});

//イベントリスナーをセットする。
function setupCallEventHandlers(call){
    if (existingCall) {
        alert("相手が接続中のようです。");
        existingCall.close();
    }
    existingCall = call;
    console.log("existingCall = call;");
    

    call.on('stream', stream=>{
        addVideo(call,stream);
        setupEndCallUI();
        $('#their-id').text(call.remoteId); //相手のIDを表示
    });

    call.on('close', ()=>{
        removeVideo(call.remoteId);
        setupMakeCallUI();
    });
}

//相手のビデオを表示
function addVideo(call,stream){
    $('#their-video').get(0).srcObject = stream;
}

//相手のビデオを非表示
function removeVideo(peerId){
    $('#their-video').get(0).srcObject = undefined;
}

//callボタンを表示
function setupMakeCallUI(){
    $('#make-call').show();
    $('#end-call').hide();
}

//call endボタンを表示
function setupEndCallUI() {
    $('#make-call').hide();
    $('#end-call').show();
}

