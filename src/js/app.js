// Main Javascript file to control the functionality of the Web App.
App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: function() {
    console.log("App initialized...")
    return App.initWeb3();
  },

//Abstract code for web3 dependency. 
//No need to understand this code.
//Web3 will depend up on an HTTP provider and that will be provided by metamask.
//Metamask is going to be a browser extension that turns the normal web browser
//into a blockchain browser because most browsers by default don't talk to the blockchain.
  
//Metamask will inject an HTTP provider into our browser that allows our browser to 
//talk to our client side application which talks to the blockchain.
  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
	  console.log("Got web3 from Meta Mask.");
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
	  console.log("Got web3 from instance.");
    }
    return App.initContracts();
  },
//The 7545 port is same as mentioned in Ganache server.
//MAKE SURE THE PORT SPECIFIED ABOVE IS SAME AS REFLECTED IN GANACHE.

  initContracts: function() {
    $.getJSON("TokenSale.json", function(TokenSale) {
      App.contracts.TokenSale = TruffleContract(TokenSale);
      App.contracts.TokenSale.setProvider(App.web3Provider);
      App.contracts.TokenSale.deployed().then(function(TokenSale) {
        console.log("Token Sale Address:", TokenSale.address);
      });
    }).done(function() {  //When the above is done, we also want to get the  token.
      $.getJSON("Token.json", function(Token) {
        App.contracts.Token = TruffleContract(Token);
        App.contracts.Token.setProvider(App.web3Provider);
        App.contracts.Token.deployed().then(function(Token) {
          console.log("Token Address:", Token.address);
        });
//$.getJSON() is used to read out the json files in the directory.
        App.listenForEvents();
        return App.render();
      });
    })
  },


//To update the page for total tokens you have after you bought new tokens.
//Simple Event listener.
  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.TokenSale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },

//All of the below is DOM Manipulation us js.
  render: function() {
    if (App.loading) {
      return;
      //if app is still loading, exit the function.
    }
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('#accountAddress').html("Your Account: " + account);
        //above is to display the Account address on the webpage.
      }
    })

    // Load token sale contract
    App.contracts.TokenSale.deployed().then(function(instance) {
      TokenSaleInstance = instance;
      return TokenSaleInstance.tokenPrice();
    }).then(function(tokenPrice) {
      App.tokenPrice = tokenPrice;
      $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
      return TokenSaleInstance.tokensSold();
    }).then(function(tokensSold) {
      App.tokensSold = tokensSold.toNumber();
      $('.tokens-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      //Blue Progress Bar for tokens sold.
      var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
      $('#progress').css('width', progressPercent + '%');

      // Load token contract
      App.contracts.Token.deployed().then(function(instance) {
        TokenInstance = instance;
        return TokenInstance.balanceOf(App.account);
      }).then(function(balance) {
        $('.balance').html(balance.toNumber());
        App.loading = false;
        loader.hide();
        content.show();
      })
    });
  },

//Code to add functionality to BUY TOKENS BUTTON.
//SEE AT 33:30 in Buying ERC-2O TOKENS IN A CROWD SALE.
  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    App.contracts.TokenSale.deployed().then(function(instance) {
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 500000 // Gas limit
      });
    }).then(function(result) {
      console.log("Tokens bought...");
      $('form').trigger('reset'); // reset number of tokens in form
      // Wait for Sell event

    });
  }
}

// Whenever the window loads, we want to initialize our App.
$(function() {
  $(window).load(function() {
    App.init();
  })
});

//We will wire up this App to talk to the blockchain.
//web3 is a js library that we use to get our front end client(src) to talk to the blockchain
//when deployed on a server or local machine.




//METAMASK CONFIGURATION HAS TO BE DONE. SEE AT 27:00 IN BUILDING OUT AN ERC-20.....
//IMPORT THE PRIVATE KEY ALSO AS DEPICTED IN VIDEO AT 29:20 IN METABASK EXTENSION.

//THE DAP TOKEN SALE ADDRESS WILL NOW APPEAR IN INSPECT WINDOW AS SHOWN AT 30:38
//THE DAP TOKEN ADDRESS WILL ASO APPEAR IN INSPECT WINDOW AS SHOWN AT 33:26

