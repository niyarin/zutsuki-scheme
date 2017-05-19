Zutsuki = {};

const is_node = typeof require !== "undefined";
if (is_node){
    module.exports = Zutsuki;
}



Zutsuki.TYPE_SYMBOL = 2;
Zutsuki.TYPE_PAIR = 1;
Zutsuki.TYPE_CHAR = 3;
Zutsuki.TYPE_STRING = 4;
Zutsuki.TYPE_NUMBER = 5;
Zutsuki.TYPE_BYTEVECTOR = 6;
Zutsuki.TYPE_VECTOR = 7;
Zutsuki.TYPE_BOOLEAN = 8
Zutsuki.TYPE_SYNTAX = 10;

Zutsuki.NUMBER_TYPE_UNSIGNED_INTEGER = 1;

Zutsuki.TYPE_DATUM_LABEL = 100;
Zutsuki.TYPE_CONST_VARIABLE = 101;
Zutsuki.TYPE_INLINE_FUNCTION = 102;

Zutsuki.ERROR = {"reason":""};

Zutsuki.REPL_TAG = {};
Zutsuki.GENERATED_TAG = {};



Zutsuki.Symbol = function(data,line,filename){
    this.type = Zutsuki.TYPE_SYMBOL;
    this.data = data;
    this.line = line;
    this.filename = filename;
}

Zutsuki.Pair = function(car,cdr){
    this.type = Zutsuki.TYPE_PAIR;
    this.car = car;
    this.cdr = cdr;
    this.circle_flag = false;
}

Zutsuki.Char = function(data){
    this.type = Zutsuki.TYPE_CHAR;
    this.data = data;
}

Zutsuki.String = function(data){
    this.type = Zutsuki.TYPE_STRING;
    this.data = data;
}

Zutsuki.Boolean = function(data){
    this.type = Zutsuki.TYPE_BOOLEAN;
    if (data == "#t"||data == "#true"){
        this.data = true;
    }else{
        this.data = false;
    }
}

Zutsuki.Number = function(data,type){
    this.type = Zutsuki.TYPE_NUMBER;
    this.number_type = type;
    this.data = data;
}

Zutsuki.Bytevector = function(data){
    this.type = Zutsuki.TYPE_BYTEVECTOR;
    this.data = data;
}

Zutsuki.Vector = function(data){
    this.type = Zutsuki.TYPE_VECTOR;
    this.data = data;
}



Zutsuki.Datum_label = function(data){
    this.type = Zutsuki.TYPE_DATUM_LABEL;
    this.data = data;
}

Zutsuki.Const_variable = function(data){
    this.type = Zutsuki.TYPE_CONST_VARIABLE;
    this.data = data;
}

Zutsuki.Inline_function = function(data){
  this.type = Zutsuki.TYPE_INLINE_FUNCTION;
  this.data = data;
}





//短縮
Zutsuki.ZP = function(car,cdr){
    return new Zutsuki.Pair(car,cdr);
}

Zutsuki.SYM = function(data){
   return new Zutsuki.Symbol(data,-1,Zutsuki.GENERATED_TAG);
}

Zutsuki.TRUE = function(data){
    return new Zutsuki.Boolean("#t");
}
Zutsuki.FALSE = function(data){
    return new Zutsuki.Boolean("#f");
}
