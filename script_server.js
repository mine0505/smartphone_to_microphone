'use strict';

let localStream = null;
let peer = null;
let existingCall = null;

// 音声・映像をデバイスから取得
// これどっちかをtrueにしないと、errorが返るので注意
navigator.mediaDevices.getUserMedia({video: true, audio: false})
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
peer = new Peer("minemine19970505",{
    key: '3e476ddb-1eff-4488-b7f4-ab48065bcf42',
    debug: 3
});

// 成功するとopenイベントが発火
// PeerIDとは、イメージ的には電話番号みたいなもの

// PeerIDと呼ばれるクライアント識別用のIDが
// シグナリングサーバで発行され、
// コールバックイベントで取得できます。
// PeerIDはクライアントサイドで指定することもできます。
// 以下の処理では、PeerIDが発行されたら、
// その情報をUIに表示する処理を行っています。
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

// 発信ボタンをクリックした場合に相手に発信します。
// peer.call()で相手のPeerID、
// 自分自身のlocalStreamを引数にセットし発信します。
// 接続するための相手のPeerIDは、
// 別途何らかの方法で入手する必要があります。
// 発信後はCallオブジェクトが返ってくるため、
// 必要なイベントリスナーをセットします。
$('#make-call').submit(e => {
    e.preventDefault();
    const call = peer.call($('#callto-id').val(), localStream);
    setupCallEventHandlers(call);
});

// 切断ボタンをクリックした場合に、相手との接続を切断します。 
// call.close()で該当する接続を切断します。
// 発信処理で生成したCallオブジェクトは
// existingCallとして保持しておきます。
// オブジェクト保持は発信処理のsetupCallEventHandlers()
// の中で実行します。
$('#end-call').click(() => {
    existingCall.close();
});

// 相手から接続要求がきた場合に応答します。 
// 相手から接続要求が来た場合はcallが発火します。 
// 引数として相手との接続を管理するためのCallオブジェクトが取得できるため、
// call.answer()を実行し接続要求に応答します。
// この時に、自分自身のlocalStreamをセットすると、
// 相手にカメラ映像・マイク音声を送信することができるようになります。
// 発信時の処理と同じくsetupCallEventHandlersを実行し、
// Callオブジェクトのイベントリスナーをセットします。
peer.on('call', call => {
    call.answer(localStream);
    setupCallEventHandlers(call);
});

// existingCallをセットして
function setupCallEventHandlers(call){
    if(existingCall == null){
        existingCall = call;
    }
    else if(existingCall !== call) {
        call.close();
    };
    // existingCall = call;
    
    // 繋がったとき
    call.on('stream', stream => {
        addVideo(call,stream);  // 相手のビデオの表示
        setupEndCallUI();       // 切るボタンとかを表示
        $('#their-id').text(call.remoteId); // 相手のIDを表示
    });

    // 切れたとき？ => #end-callのところは？
    // 切断要求が来たときかも
    call.on('close', () => {
        removeVideo(call.remoteId); // 相手のビデオを非表示に
        setupMakeCallUI();  // 繋ぐボタンとかを表示
    });
}

// 相手のビデオを表示
function addVideo(call,stream){
    $('#their-video').get(0).srcObject = stream;
}

// 相手のビデオを非表示に
function removeVideo(peerId){
    $('#their-video').get(0).srcObject = undefined;
}

// 繋ぐボタンを表示、終わるボタンを非表示
function setupMakeCallUI(){
    $('#make-call').show();
    $('#end-call').hide();
}

// 繋ぐボタンを非表示、終わるボタンを表示
function setupEndCallUI() {
    $('#make-call').hide();
    $('#end-call').show();
}

