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

Zutsuki.TYPE_ERROR = 11;

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


Zutsuki.Error = function(message,file,line){
    this.type = Zutsuki.TYPE_ERROR;
    this.error_type = null;
    this.message = message;
    this.code = null;
    this.file = file;
    this.line = line;
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



Zutsuki.generate_error_with_hint_object = function(message,hint_object,error_type){
    //エラーオブジェクトを生成する。
    //Scheme Objectをhint_objectとして、エラーの位置をそこから得る.
    
    var line = -1;
    var line_min = -1;
    var line_max = -1;
    var filename = null;
    var hit = 0;

    function search(object,searched){
        if (object){
            if (object.type == Zutsuki.TYPE_PAIR){
                if (object.circle_flag){
                    if (searched[object]){
                        return;
                    }
                    searched[object] = true;
                }
                search(object.car,object.cdr);
            }else{

                if (object.line && object.filename){
                    if (hit == 0){
                        line = object.line;
                        filename = object.filename;
                        hit = 1

                        line_min = line;
                        line_max = line;
                    }else if (hit == 1){
                        if (filename != object.filename){
                            hit == 2;
                        }else{
                            if (line == object.line){
                            
                            }else{
                                if (Math.abs(line-object.line) == 8){
                                    hit = 2;
                                }

                                line_min = Math.min(object.line,min_line)
                                line_max = Math.max(object.line,max_line)
                                line = (line_min + line_max)/2;
                            }
                        }
                    }else if (hit == 2){
                        return;
                    }               
                }
                
            }
        }
    }

    search(hint_object,{});
    var res = null;
    if (line == -1){
        res = new Zutsuki.Error(message);
        res.code = hint_object;
    }else if (line_min == line_max){
        res = new Zutsuki.Error(message,filename,line);
        res.code = hint_object;
    }else{
        const line_message = line_min + "-" + line_max;
        res = new Zutsuki.Error(message,filename,line_message);
        res.code = hint_object;
    }
    return res;
}





Zutsuki.printer = function(obj){
    function loop(o,looked){
        if (!o){
            return "'()";
        }
        
        if (o.type == Zutsuki.TYPE_PAIR){
            var res = "";
            if (o.circle_flag){
                return "<CIRCLE OBJECT>";
            }else{
                res += "(";
                var cell = o;
                while (cell){
                    if (cell.type != Zutsuki.TYPE_PAIR){
                        res += " . ";
                        res += loop(cell,looked);
                        break;
                    }
                    res += " " + loop(cell.car,looked);
                    cell = cell.cdr;
                }
                res += ")";
                return res;
            }
        }else if (o.type == Zutsuki.TYPE_SYMBOL){
            return o.data;
        }else if (o.type == Zutsuki.TYPE_NUMBER){
            return o.data;
        }else{
            return "<?OBJECT>";
        }

    }
    return loop(obj,{});
}




