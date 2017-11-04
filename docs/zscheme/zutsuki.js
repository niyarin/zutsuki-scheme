Zutsuki = {};

var is_node = typeof require !== "undefined";
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
Zutsuki.NUMBER_TYPE_REAL = 2;

Zutsuki.TYPE_DATUM_LABEL = 100;
Zutsuki.TYPE_CONST_VARIABLE = 101;
Zutsuki.TYPE_INLINE_FUNCTION = 102;
Zutsuki.TYPE_RENAMED_SYMBOL = 103;
Zutsuki.TYPE_USER_PROCEDURE = 104;
Zutsuki.TYPE_REREAD = 200;



Zutsuki.ERROR = {"reason":""};

Zutsuki.REPL_TAG = {};
Zutsuki.GENERATED_TAG = {};



Zutsuki.Symbol = function(data,line,filename){
    this.type = Zutsuki.TYPE_SYMBOL;
    this.data = data;
    this.line = line;
    this.filename = filename;
}

Zutsuki.RenamedSymbol = function(data){
    this.type = Zutsuki.TYPE_RENAMED_SYMBOL;
    this.org = data;
    
    this.global = null;
    this.local = null;

    this.rename_flag = false;

    this.data = null;
    this.line = -1;
    this.filename = null;
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

Zutsuki.Inline_function = function(data,const_sym){
    this.type = Zutsuki.TYPE_INLINE_FUNCTION;
    this.data = data;
    this.const_sym = const_sym;//呼び出し位置ではない場合使う
}

Zutsuki.User_procedure = function(name){
    this.type = Zutsuki.TYPE_USER_PROCEDURE;
    this.name = name;
    this.const_id = -1;
    this.is_recursive = false;
}


Zutsuki.Error = function(message,file,line){
    this.type = Zutsuki.TYPE_ERROR;
    this.error_type = null;
    this.error_stack = [];
    this.message = message;
    this.code = null;
    this.file = file;
    this.line = line;
}

Zutsuki.Reread = function(parentheses_stack,atom_and_container_objects ){
    this.type = Zutsuki.TYPE_REREAD;
    this.atom_and_container_objects = atom_and_container_objects;
    this.parentheses_stack = parentheses_stack;

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


//jaarrayから再帰的にzutsuki-listに変換する
Zutsuki.gencode = function(jsarray){
    if (Array.isArray(jsarray)){
        var cell =  Zutsuki.ZP(null,null);
        var top_cell =cell;
        for (var i=0;i<jsarray.length;i++){
            cell.cdr = Zutsuki.ZP(Zutsuki.gencode(jsarray[i]),null);
            cell = cell.cdr;
        }
        return top_cell.cdr;
    }else if (typeof jsarray == "string"){
        return Zutsuki.SYM(jsarray);
    }else{
        return jsarray;
    }
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
                    res += loop(cell.car,looked);
                    if (cell && cell.cdr){
                        res += " ";
                    }
                    cell = cell.cdr;
                }
                res += ")";
                return res;
            }
        }else if (o.type == Zutsuki.TYPE_SYMBOL){
            return o.data;
        }else if (o.type == Zutsuki.TYPE_RENAMED_SYMBOL){
            return "<RENAME_" + o.org.data + ">";
        }else if (o.type == Zutsuki.TYPE_NUMBER){
            return o.data;
        }else if (o.type == Zutsuki.TYPE_SYNTAX){
            return "<syntax " + o.syntax_name + ">";
        }else if (o.type == Zutsuki.TYPE_BOOLEAN){
            if (o.data){
                return "#t"
            }else{
                return "#f"
            }
        }else{
            return "<?OBJECT>";
        }

    }
    return loop(obj,{});
}

Zutsuki.zerror2string = function(zerr){

    if (!zerr || typeof zerr != "object" || zerr.type != Zutsuki.TYPE_ERROR){
        return "JS ERROR::" + zerr;
    }

    var res = zerr.message;
    if (zerr.line && zerr.line != -1){
        res += "  @[" + zerr.file + " " + zerr.line + "]";
    }
    if (zerr.code){
        res += ":   " + Zutsuki.printer(zerr.code);
    }

    if (zerr.error_stack.length){
        res += "\n\n---- MACRO TRACE ----";
        for (var i=0;i<zerr.error_stack.length;i++){
            var mm = Zutsuki.zerror2string(zerr.error_stack[i]);   
            res += "\n" + mm;
        }
    }

    return res;
}


Zutsuki.renamed_symbol2symbol = function(renamed_symbol,new_symbol){
    if (!new_symbol && new_symbol!=""){
        new_symbol = renamed_symbol.org.data;
    }
    renamed_symbol.data = new_symbol;
    renamed_symbol.line = renamed_symbol.org.line;
    renamed_symbol.filename = renamed_symbol.org.filename;
    renamed_symbol.type = Zutsuki.TYPE_SYMBOL;
    return renamed_symbol;
}
