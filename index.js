/*
1.連接節點
2.連接合約
#如果要看如何呼叫recall的合約函式，請參照更新碳幣量(balance of)
  const { balanceOf } = this.meta.methods;
  const balance = await balanceOf(this.account).call();
#如果需要呼叫transfer的合約函式，請參照
  //利用web3找nonce
  const nonce=await web3.eth.getTransactionCount(sender[i][1]);
  //資料細項
  var rawtx = {
    nonce: nonce,//代表此地址的已交易數量
    gasPrice: web3.utils.toHex(web3.utils.toWei('2', 'gwei')),
    gasLimit: web3.utils.toHex(100000),
    to: metaCoinArtifact.networks[4].address,
    data: this.meta.methods.addFootprint(sender[i][1],parseInt(new_footprint_data[1])).encodeABI(),//要使用的函式

  };

  const tx = new EthereumTx(rawtx,{chain: 'rinkeby' });//建立細項
  tx.sign(key);//進行離線簽名
  const stx = tx.serialize();
  //傳送交易至區塊鏈
  try{
  await web3.eth.sendSignedTransaction('0x' + stx.toString('hex'))
  .once('transactionHash', function(hash){ console.log("txHash", hash) })
              .once('receipt', function(receipt){ console.log("receipt", receipt) })
              .on('confirmation', function(confNumber, receipt){ console.log("confNumber",confNumber,"receipt",receipt) })
              .on('error', function(error){ console.log("error", error) })
              .then(function(receipt){
                  console.log("trasaction finish!", receipt);
              });
  this.setFootprintStatus("Transaction complete!");
  }
*/
import Web3 from "web3";
import metaCoinArtifact from "../../build/contracts/Carbon.json";

const App = {
  web3: null,
  account: null,
  meta: null,
  sender:[ ],
  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = metaCoinArtifact.networks[networkId];
      //連接合約
      this.meta = new web3.eth.Contract(
        metaCoinArtifact.abi,//合約abi
        deployedNetwork.address,//合約地址
      );
      // get accounts
      const accounts = await web3.eth.getAccounts();
      //const accounts='0xEfEA16dBC0D65b822fd80ed0D31496DC0f14Fd53';
      this.account = accounts[0];
      //this.account=accounts;
      const accountElement = document.getElementById("account");
      accountElement.innerHTML = this.account;
      this.refreshBalance();
    } 
    catch (error) {
      alert("尚未連接...");
    }
  },

//更新碳幣量
refreshBalance: async function() {
  const { balanceOf } = this.meta.methods;
  const balance = await balanceOf(this.account).call();

  const balanceElement = document.getElementsByClassName("balance")[0];
  balanceElement.innerHTML = balance;
},

//碳幣
sendCoin: async function() {
  const coinAmount = parseInt(document.getElementById("coin_amount").value);
  const receiver = document.getElementById("coin_receiver").value;

  this.setCoinStatus("Initiating transaction... (please wait)");

  const {transfer} = this.meta.methods;
  document.getElementById('sendCoin').disabled=true;
  try{
    await transfer(receiver, coinAmount).send({ from: this.account });
    this.setCoinStatus("Transaction complete!");
  }
  catch(err){
    alert("資訊錯誤...");
    this.setCoinStatus("資訊錯誤...");
  }
  document.getElementById('sendCoin').disabled=false;
  this.refreshBalance();
},

//碳足跡自動寫入
sendFootprint:async function(new_footprint_data) {
const { web3 } = this;
const{ sender }=this;
const EthereumTx = require('ethereumjs-tx').Transaction;

this.setFootprintStatus("Initiating transaction... (please wait)");
for(var i=0;i<sender.length;i++){
if(new_footprint_data.includes(sender[i][0])==true){
var key = new Buffer.from(sender[i][2], 'hex'); //將私鑰的每個字碼改成16進制
const nonce=await web3.eth.getTransactionCount(sender[i][1]);//利用web3找nonce
//資料細項
var rawtx = {
  nonce: nonce,//代表此地址的已交易數量
  gasPrice: web3.utils.toHex(web3.utils.toWei('2', 'gwei')),
  gasLimit: web3.utils.toHex(100000),
  to: metaCoinArtifact.networks[4].address,
  data: this.meta.methods.addFootprint(sender[i][1],parseInt(new_footprint_data[1])).encodeABI(),//要使用的方法

};

const tx = new EthereumTx(rawtx,{chain: 'rinkeby' });//建立細項
tx.sign(key);//進行離線簽名
const stx = tx.serialize();
//傳送交易至區塊鏈
try{
await web3.eth.sendSignedTransaction('0x' + stx.toString('hex'))
.once('transactionHash', function(hash){ console.log("txHash", hash) })
              .once('receipt', function(receipt){ console.log("receipt", receipt) })
              .on('confirmation', function(confNumber, receipt){ console.log("confNumber",confNumber,"receipt",receipt) })
              .on('error', function(error){ console.log("error", error) })
              .then(function(receipt){
                  console.log("trasaction finish!", receipt);
              });
this.setFootprintStatus("Transaction complete!");
}
catch(err){
  alert(err.message);
  if(err.message=='Returned error: replacement transaction underpriced'){
    this.setFootprintStatus("金額不足...");
  }
  else{this.setFootprintStatus("系統錯誤...");}
  }
  break; 
}
else{if(i==sender.length-1){alert("找不到此帳號")}}
}
},
//test footprint  
inputFootprint: async function(){
    var new_data=[];
    var regex = /^([a-zA-Z0-9\s_\\.\-:()])+(.csv|.txt)$/;
    if (regex.test($("#fileUpload").val().toLowerCase())) {
      
      if (typeof (FileReader) != "undefined") {
        
        var reader = new FileReader();
        reader.readAsText($("#fileUpload")[0].files[0]);
        reader.onload = async function (e) {
          var rows=e.target.result.split("\n");
          for(var i=1;i<rows.length-1;i++){
            var cell=rows[i].split(",");               
              //new_data.push([String(cell[0]),cell[3]]);
              new_data.push([String(cell[0]),cell[4]]);
          }

        for(var j=0;j<new_data.length;j++){

          await App.sendFootprint(new_data[j]);
          await new Promise(r => setTimeout(r, 5000)); 
        }
        App.setFootprintStatus("mission complete!");
        }          
      } 
      else {
        alert("This browser does not support HTML5.");
      }
    } 
    else {
      alert("Please upload a valid CSV file.");
    }
}, 

//查詢某地址最新碳足跡
  searchFootprint:async function() {
    const searchAddress = document.getElementById("footprint_address").value;

    const {searchFootprint} = this.meta.methods;
    this.footprintNewest("等待查找");
    document.getElementById('searchFootprint').disabled=true;
    try{
      const datanewest=await searchFootprint(searchAddress).call();
      this.footprintNewest(datanewest);
    }
    catch(err){
      alert('無此地址資料');
      this.footprintNewest("無法查找");
    }
        
    document.getElementById('searchFootprint').disabled=false;
  },

//歷史足跡
  piechart:null,
  searchHistory:async function() {
    const{ sender }=this;
    const {getHistory}= this.meta.methods;
    this.footprintHistory("查找中...");
    const datahistory=await getHistory().call();
    const data=String(datahistory).split(',');

    //delete graph
    
    if(this.piechart!=null){
      this.piechart.destroy();
    }

    //insert grapg data
    var pie_store=[];
    var all_account=[];
    var all_acccount_amount=[];
    var factory_name=[];
    //篩選使用到的地址
    for(var i=0;i<data.length;i=i+2){
      var new_account=pie_store.indexOf(data[i+1]);
      if(new_account==-1)
      {
        all_account.push(data[i+1]);
        
      }     
      pie_store.push(data[i+1]);
      
      }
    //地址轉成廠區
    for(var i=0;i<all_account.length;i++){
      for(var j=0;j<sender.length;j++){
        if(sender[j][1]==all_account[i]){
          factory_name.push(sender[j][3]);
        }
      }
    }
    //計算使用到的地址次數
    for(var i=0;i<all_account.length;i++){
      var sreach_amount=pie_store.filter(function(value){
        return value==all_account[i];
      });
      all_acccount_amount.push(sreach_amount.length);
    }

    //draw
    var pie =document.getElementById("Pie_chart").getContext("2d");
    var myPieChart = new Chart(pie,{
      type: 'outlabeledPie',
      data: {
          labels: factory_name,
          datasets: [
              {
                  data: all_acccount_amount,
                  backgroundColor: [
                      "#FF6384",
                      "#36A2EB",
                      "#FFCE56",
                      "#adff2f",
                      "#77ffcc",
                      "#CCCCFF",
                      "#E28EFF",
                      "#00FF00",
                      "#FF5511"
                  ],
                  hoverBackgroundColor: [
                      "#FF6384",
                      "#36A2EB",
                      "#FFCE56",
                      "adff2f",
                      "#77ffcc",
                      "#CCCCFF",
                      "#E28EFF",
                      "#00FF00",
                      "#FF5511"
                  ]
              }]
      },
      options: {
        zoomOutPercentage: 37,
        maintainAspectRatio: false,
        responsive: false,
        plugins: {
          legend: false,
          outlabels: {
          text: '%l %p',
          color: 'black',
          stretch: 10,
          font: {
              resizable: true,
              minSize: 12,
              maxSize: 14
          }
        }
      } 
      }
  });
    this.footprintHistory('');
    this.piechart=myPieChart;
  },

//碳排追蹤
  linechart:null,
  searchAim:async function(){

    const {getHistory}= this.meta.methods;
    this.footprintAim("查找中...");
    document.getElementById('searchAim').disabled=true;
    const datahistory=await getHistory().call();
    const data=String(datahistory).split(',');

    //delete graph
    if(this.linechart!=null){
      this.linechart.destroy();
    }

    //insert graph data
    var store=[];
    for(var i=0;i<data.length;i=i+2){     
      store.push([data[i],data[i+1]]);
      }
    var show_data=[];
    var show_label=[];
    var result='';
    for(var j=0;j<store.length;j=j+1){
      if(String(store[j][1])==String(document.getElementById("footprint_aim").value)){
        show_data.push(store[j][0]);
        show_label.push(show_data.length);
      }      
    }
    show_label.push(show_data.length+1);
    if(show_data==''){
      result='查無資料';
    }
    else{
      result=null;
    }
    this.footprintAim(result);

  //畫圖
  if(show_data!=''){
    Chart.plugins.register(ChartDataLabels);
    var rectangleSet = false;

    var canvasTest = $('#chart');
    var chartResize=$('.chart');
    var new_length=String(100+show_data.length*100+"px");
    chartResize.width(new_length);
    chartResize.height('400px');
    var chartTest= new Chart(canvasTest, {
    type: "line",
    data: {
        
        labels: show_label,
        datasets: [{
            label: '碳排量',
            data: show_data,
            backgroundColor: 
                'rgba(226, 244, 253, 0.5)',
            borderColor: 
                'rgba(19, 57, 153, 1)',
            borderWidth: 2
        }]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,  
      scales: {          
          xAxes: [{
              scaleLabel: {
                fontSize: 16,
                display: true,
                labelString: '筆數'
              },
              ticks: {
                  fontSize: 12,
                  display: true,
              }
          }],
          yAxes: [{
              scaleLabel: {
                fontSize: 16,
                display: true,
                labelString: '碳排量(CO2e)'
              },
              ticks: {
                  fontSize: 12,
                  beginAtZero: true
              }
          }]
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'top',
          formatter: Math.round,
          font: {
            weight: 'bold',
            size: 16
            }
          }
      },
        animation: {
          onComplete: function () {
              if (!rectangleSet) {
                  //var scale = window.devicePixelRatio;                       

                  var sourceCanvas = chartTest.chart.canvas;
                  //var copyWidth = chartTest.scales['y-axis-0'].width - 10;
                  //var copyHeight = chartTest.scales['y-axis-0'].height + chartResize.scales['y-axis-0'].top+10;

                  var targetCtx = document.getElementById("scroll").getContext("2d");

                  //targetCtx.scale(scale, scale);
                  //targetCtx.canvas.width = copyWidth * scale;
                  //targetCtx.canvas.height = copyHeight * scale;
                  

                  /*targetCtx.canvas.style.width = String(copyWidth)+"px";
                  targetCtx.canvas.style.height = String(copyHeight)+"px";
                  targetCtx.drawImage(sourceCanvas,  0, 0, copyWidth * scale, copyHeight * scale);*/
                  targetCtx.canvas.style.width = "600px";
                  targetCtx.canvas.style.height = "0px";
                  targetCtx.drawImage(sourceCanvas,  0, 0, '600px', '0px');
                  rectangleSet = true;
              }
            }
        }
      }
      
    });
    this.linechart=chartTest;
  }
  document.getElementById('searchAim').disabled=false; 
},

  
//查詢碳足跡顯示 
  footprintNewest: function(message) {
    const status = document.getElementById("search_status");
    status.innerHTML = message;
  },
//所有碳足跡資料顯示
  footprintHistory: function(message) {
    const status = document.getElementById("history_status");
    status.innerHTML = message;
  },
//單地址追蹤
  footprintAim: function(message) {
    const status = document.getElementById("aim_status");
    status.innerHTML = message;
  },
//碳幣傳送狀態
setCoinStatus: function(message) {
  const status = document.getElementById("coin_status");
  status.innerHTML = message;
},
//碳足跡傳送狀態
setFootprintStatus:function (message){
  const status = document.getElementById("footprint_status");
    status.innerHTML = message;
}
};

window.App = App;

window.addEventListener("load", function() {
   {
    if (window.ethereum) {
      // 連接錢包(ex:mateamask)
      App.web3 = new Web3(window.ethereum);
      window.ethereum.enable(); // get permission to access accounts
    } 
   else {
    // 連接節點(這裡為infura所提供rinkeby測試網的節點)
  App.web3 = new Web3(
      new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/864eecfb0f504515833d1d9d3d2e8902'),
  );
 } 
 }
  App.start();
});
