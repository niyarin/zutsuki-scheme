const is_node = typeof require !== "undefined";
if (is_node){
    var ZLexer = require("./lexer.js");
    var Interface = require("./interface.js");
}



Interface.node_main();
