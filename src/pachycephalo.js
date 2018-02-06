var is_node = typeof require !== "undefined";


var Pachycephalo = {};

if (is_node){
    module.exports = Pachycephalo;
    var Pachycephalo_Procejures = require("./pachycephalo_procedures");
    Pachycephalo_Procejures.pachycephalo = Pachycephalo;
}




Pachycephalo.TYPE_PAIR = 0;
Pachycephalo.TYPE_BOOLEAN = 1;
Pachycephalo.TYPE_PROCEDURE = 2;
Pachycephalo.TYPE_CLOSURE = 3;
Pachycephalo.TYPE_CONTINUATION = 4;
Pachycephalo.TYPE_SPECIAL_PROCEDURE = 5;
Pachycephalo.TYPE_SYMBOL = 6;
Pachycephalo.TYPE_VECTOR = 7;

Pachycephalo.TYPE_INTEGER = 8;
Pachycephalo.TYPE_ERROR = 9;

Pachycephalo.TYPE_UNDEF = 10;
Pachycephalo.TYPE_NULL = 11;
Pachycephalo.TYPE_RECORD = 12;
Pachycephalo.TYPE_NUMBER = 13;
Pachycephalo.TYPE_CHAR = 14;
Pachycephalo.TYPE_JS_PROC1 = 15;
Pachycephalo.TYPE_STRING = 16;

Pachycephalo.TYPE_FLOAT = 17;
Pachycephalo.TYPE_PORT = 18;

Pachycephalo.TYPE_ENVIRONMENT = 20;


Pachycephalo.FALSE_OBJECT = {"type":Pachycephalo.TYPE_BOOLEAN};
Pachycephalo.TRUE_OBJECT = {"type":Pachycephalo.TYPE_BOOLEAN};
Pachycephalo.UNDEF_OBJECT = {"type":Pachycephalo.TYPE_UNDEF};
Pachycephalo.NULL_OBJECT = {"type":Pachycephalo.TYPE_NULL};






Pachycephalo.NUMBER_TYPE_REAL = 1;


Pachycephalo.Pair = function(a,b){
    this.car = a;
    this.cdr = b;
    this.type = Pachycephalo.TYPE_PAIR;
    this.car_circle = false;
    this.cdr_circle = false;

}

Pachycephalo.Vector = function(data){
    this.data = data;
    this.type = Pachycephalo.TYPE_VECTOR;
    this.circle = false;
}

Pachycephalo.Procedure = function(code,arg1,arg2,line,filename){
    this.type = Pachycephalo.TYPE_PROCEDURE;
    this.code = code;
    this.arg1 = arg1;
    this.arg2 = arg2;
    this.arg1_size = arg1.length;

    this.type_check = null;

    this.line = line;
    this.filename = filename;
}

Pachycephalo.Closure = function(procedure,local_env){
    this.type = Pachycephalo.TYPE_CLOSURE;
    this.procedure = procedure;
    this.local_env = local_env;
}

Pachycephalo.Continuation = function(code,pos,stack,call_stack,local_cell,local_env,dynamic_environments,exception_handlers){
    this.type = Pachycephalo.TYPE_CONTINUATION;
    this.code = code;
    this.pos = pos;
    this.stack = stack;
    this.call_stack = call_stack;
    this.local_cell = local_cell;
    this.local_env = local_env;
    this.dynamic_environments = dynamic_environments;
    this.exception_handlers = exception_handlers;
}

Pachycephalo.Special_Procedure = function(name){
    this.type = Pachycephalo.TYPE_SPECIAL_PROCEDURE;
    this.name = name;
    //本体はVM内に書く。
}


Pachycephalo.JsProcedure1 = function(name,proc){
    this.type = Pachycephalo.TYPE_JS_PROC1;
    this.proc = proc;
    this.name = name;
}


Pachycephalo.Error = function(message,irritants){
    this.type = Pachycephalo.TYPE_ERROR;
    this.message = message;
    this.irritants = irritants;
}



Pachycephalo.Integer = function(number){
    this.type = Pachycephalo.TYPE_INTEGER;
    this.number = number;
}



Pachycephalo.Number = function(number,number_type){
    this.type = Pachycephalo.TYPE_NUMBER;
    this.number = number;
    this.number_type = number_type;
}

Pachycephalo.Float = function(number){
    this.type = Pachycephalo.TYPE_FLOAT;
    this.number = number;
}

Pachycephalo.Symbol = function(sym){
    this.data = sym;
    this.type = Pachycephalo.TYPE_SYMBOL;
}

Pachycephalo.Char = function(c){
    this.data = c;
    this.type = Pachycephalo.TYPE_CHAR;
}



Pachycephalo.Record = function(data,record_name){
    this.data = data;
    this.record_name = record_name;
    this.type = Pachycephalo.TYPE_RECORD;
}


Pachycephalo.String = function(data){
    this.type = Pachycephalo.TYPE_STRING;
    this.data = data;
}


Pachycephalo.Port = function(port,port_fun){
    this.type = Pachycephalo.TYPE_PORT;
    this.data = port;
    this.port_fun = port_fun;
}

Pachycephalo.console_log = function(obj){
    console.log(obj);
}


Pachycephalo.env_id = 0;
Pachycephalo.Environment = function(const_data){
    this.type = Pachycephalo.TYPE_ENVIRONMENT;
    this.global = {};
    this.const_data = const_data;
    this.export_symbols = [];
    this.id = Pachycephalo.env_id;
    Pachycephalo.env_id++;
}

Pachycephalo.create_zutsuki_zero_env = function(const_data){
    var res = new Pachycephalo.Environment(const_data);
    Pachycephalo.set_pachycephalo_zero(res);
    return res;
}





Pachycephalo.set_pachycephalo_zero = function(env){
    var core0 = Pachycephalo_Procejures.core0();
    var list1 = Pachycephalo_Procejures.list_library1();
    var compare = Pachycephalo_Procejures.compare_library();
    var number = Pachycephalo_Procejures.number_library();
    
    env.global["call/cc"] = Pachycephalo.BUILT_IN_CALL_CC;
    env.global["call-with-current-continuation"] = Pachycephalo.BUILT_IN_CALL_CC;
    env.global["dynamic-wind"] = Pachycephalo.BUILT_IN_DYNAMIC_WIND;

    env.global["call-with-values"] = core0["call-with-values"];
    env.global["values"] = core0["values"];
    env.global["with-exception-handler"] = core0["with-exception-handler"];
    env.global["raise-continuable"] = core0["raise-continuable"];
    env.global["raise"] = core0["raise"];
    env.global["error"] = core0["error"];

    env.global["list"] = list1["list"];
    env.global["cons"] = list1["cons"];
    env.global["car"] = list1["car"];
    env.global["cdr"] = list1["cdr"];
    env.global["length"] = list1["length"];
    env.global["reverse"] = list1["reverse"];
    env.global["append"] = list1["append"];

    env.global["null?"] = list1["null?"];
    env.global["pair?"] = list1["pair?"];
    env.global["list?"] = list1["list?"];

    env.global["eqv?"] = compare["eqv?"];
    env.global["eq?"] = compare["eq?"];
    env.global["equal?"] = compare["equal?"];


    env.global["integer?"] = number["integer?"];


    env.global["apply1"] = core0["apply1"];
}


Pachycephalo.BUILT_IN_CALL_CC = new Pachycephalo.Special_Procedure("call-with-current-continuation");
Pachycephalo.BUILT_IN_DYNAMIC_WIND = new Pachycephalo.Special_Procedure("dynamic-wind");



Pachycephalo.predicates = {};
Pachycephalo.predicates.procedure = function(x){
    return (x.type == Pachycephalo.TYPE_PROCEDURE) ||
           (x.type == Pachycephalo.TYPE_CLOSURE);
}




Pachycephalo.VmCode = {};

Pachycephalo.VmCode.EXIT = 1;
Pachycephalo.VmCode.UNLESS = 2;
Pachycephalo.VmCode.SKIP = 3;
Pachycephalo.VmCode.POP = 4;

Pachycephalo.VmCode.CONS = 5;
Pachycephalo.VmCode.CAR = 6;
Pachycephalo.VmCode.CDR = 7;
Pachycephalo.VmCode.SWAP = 8;
Pachycephalo.VmCode.DUP = 9;


Pachycephalo.VmCode.PUSH_TRUE = 11;
Pachycephalo.VmCode.PUSH_FALSE = 12;
Pachycephalo.VmCode.PUSH_NULL = 13;
Pachycephalo.VmCode.PUSH = 14;
Pachycephalo.VmCode.PUSH_NUMBER = 15;

Pachycephalo.VmCode.SETG = 20;
Pachycephalo.VmCode.LOADG = 21;
Pachycephalo.VmCode.LOAD_CONST = 22;
Pachycephalo.VmCode.LOADL = 23;
Pachycephalo.VmCode.LOADLX = 24;
Pachycephalo.VmCode.SETL = 25;
Pachycephalo.VmCode.SETLX = 26;


Pachycephalo.VmCode.ARGS = 30;
Pachycephalo.VmCode.CALL = 31;
Pachycephalo.VmCode.TAIL_CALL = 32;
Pachycephalo.VmCode.CLOSURE = 33;


Pachycephalo.VmCode.IS_NULL = 40;
Pachycephalo.VmCode.IS_PAIR = 41;
Pachycephalo.VmCode.EQV = 46;


Pachycephalo.VmCode.TOP = 50;
Pachycephalo.VmCode.END = 51;
Pachycephalo.VmCode.RET = 52;
Pachycephalo.VmCode.PUSH_CODE = 53;


Pachycephalo.VmCode.GEN_ERROR = 60;
Pachycephalo.VmCode.SET_EXCEPTION_HANDLER = 61;
Pachycephalo.VmCode.POP_EXCEPTION_HANDLER = 62;
Pachycephalo.VmCode.RAISE = 63;
Pachycephalo.VmCode.MAKE_ERROR_OBJECT = 64;
Pachycephalo.VmCode.RAISE_CONTINUABLE = 65;

Pachycephalo.VmCode.VALUES = 76;
Pachycephalo.VmCode.RECEIVE = 77;
Pachycephalo.VmCode.PUSH_WIND = 78;
Pachycephalo.VmCode.POP_WIND = 79;

Pachycephalo.VmCode.IMPORT = 80;
Pachycephalo.VmCode.RESET_ENV = 81;
Pachycephalo.VmCode.LOADGX = 82;
Pachycephalo.VmCode.ADD_LIBRARY = 83;
Pachycephalo.VmCode.SET_LIBNAME = 84;

Pachycephalo.VmCode.RECORD_PREDICATE = 90;
Pachycephalo.VmCode.RECORD_CONSTRUCTOR = 91;
Pachycephalo.VmCode.CREATE_VECTOR = 92;
Pachycephalo.VmCode.RECORD_TO_VECTOR = 93;
Pachycephalo.VmCode.VECTOR_REF = 94;
Pachycephalo.VmCode.VECTOR_SET = 95;
Pachycephalo.VmCode.SET_CAR = 100;

Pachycephalo.VmCode.ADD2 = 111;
Pachycephalo.VmCode.MUL2 = 112;
Pachycephalo.VmCode.SUB2 = 113;
Pachycephalo.VmCode.EQ2 = 114;
Pachycephalo.VmCode.EQ2X = 115;




DECODE = {};
DECODE[1] = "EXIT";
DECODE[2] = "UNLESS";
DECODE[3] = "SKIP";
DECODE[4] = "POP";
DECODE[5] = "CONS";
DECODE[6] = "CAR";
DECODE[7] = "CDR";
DECODE[8] = "SWAP";
DECODE[9] = "DUP";


DECODE[11] = "PUSH_TRUE";
DECODE[12] = "PUSH_FALSE"
DECODE[13] = "PUSH_NULL";
DECODE[14] = "PUSH";
DECODE[15] = "PUSH_NUMBER";

DECODE[20] = "SETG";
DECODE[21] = "LOADG";
DECODE[22] = "LOAD_CONST";
DECODE[23] = "LOADL";
DECODE[24] = "LOADLX";
DECODE[25] = "SETL";
DECODE[26] = "SETLX";

DECODE[30] = "ARGS";
DECODE[31] = "CALL";
DECODE[32] = "TAIL_CALL";
DECODE[33] = "CLOSURE";

DECODE[40] = "IS_NULL";
DECODE[41] = "IS_PAIR";
DECODE[46] = "EQV";

DECODE[50] = "TOP";
DECODE[51] = "END";
DECODE[52] = "RET";
DECODE[53] = "PUSH_CODE";

DECODE[60] = "GEN_ERROR";
DECODE[61] = "SET_EXCEPTION_HANDLER";
DECODE[62] = "POP_EXCEPTION_HANDLER";
DECODE[63] = "RAISE";

DECODE[77] = "RECEIVE";
DECODE[78] = "PUSH_WIND";
DECODE[79] = "POP WIND";

DECODE[80] = "IMPORT";
DECODE[81] = "RESET_ENV";
DECODE[82] = "LOADGX";
DECODE[83] = "ADD_LIBRARY";
DECODE[84] = "SET_LIBNAME";


DECODE[90] = "RECORD_PREDICATE";
DECODE[91] = "RECORD_CONSTRUCTOR";
DECODE[92] = "CREATE_VECTOR";
DECODE[93] = "RECORD_TO_VECTOR";
DECODE[94] = "VECTOR_REF";
DECODE[95] = "VECTOR_SET";



DECODE[111] = "ADD2";
DECODE[112] = "MUL2";
DECODE[113] = "SUB2";
DECODE[114] = "EQ2";



Pachycephalo.CONSOLE_LOG_PORT = new Pachycephalo.Port("console_log",Pachycephalo.console_log);

Pachycephalo.vm = function(code,enva){
    var env = enva[0];
    var stack = [];
    var call_stack = null;
    
    var local_cell = [];
    var local_env = [];
    var user_libraries = enva[1];

    //var dynamic_environments = [Pachycephalo.NULL_OBJECT,[]];
    var dynamic_environments = null;
    var exception_handlers = null;


    var pos = 0;
    var code_length = code.length;
    var next = -1;
    
    var global = env.global;

    var vm_res = 0;

    var values = Pachycephalo.NULL_OBJECT;

    var original_env = env;

    var error_code = [Pachycephalo.VmCode.GEN_ERROR,0,0,0,0];
    var error_chain_code = [Pachycephalo.VmCode.LOADL,0,
                            Pachycephalo.VmCode.RAISE,
                            Pachycephalo.VmCode.RET];
    var js_proc_error = [false,""];
    var error_chain_proc = new Pachycephalo.Procedure(error_chain_code,["obj"],null,0,"Pachycephalo");
    
    var last_res = ["res"];
    
    while (true){
        //console.log("LOG",DECODE[code[pos]],stack,code[pos],pos);
        switch (code[pos]){
            case Pachycephalo.VmCode.EXIT:
                return last_res;
            case Pachycephalo.VmCode.UNLESS:
                if (stack.pop() != Pachycephalo.FALSE_OBJECT){
                    pos+=2;
                }
                break;
            case Pachycephalo.VmCode.SKIP:
                pos += code[pos+1];
                break;
            case Pachycephalo.VmCode.POP:
                stack.pop();
                break;
            case Pachycephalo.VmCode.SWAP:
                var a = stack.pop();
                var b = stack.pop();
                stack.push(a);
                stack.push(b);
                break;
            case Pachycephalo.VmCode.DUP:
                var a = stack.pop();
                stack.push(a);
                stack.push(a);
                break;
            case Pachycephalo.VmCode.CONS:
                values = Pachycephalo.NULL_OBJECT;//多値用
                var a = stack.pop();
                var b = stack.pop()
                stack.push(new Pachycephalo.Pair(b,a));
                break;
            case Pachycephalo.VmCode.PUSH_TRUE:
                stack.push(Pachycephalo.TRUE_OBJECT);
                break;
            case Pachycephalo.VmCode.PUSH_FALSE:
                stack.push(Pachycephalo.FALSE_OBJECT);
                break;
            case Pachycephalo.VmCode.PUSH_NULL:
                stack.push(Pachycephalo.NULL_OBJECT);
                break;
            case Pachycephalo.VmCode.PUSH:
                stack.push(code[pos+1]);
                pos++;
                break;
            case Pachycephalo.VmCode.TOP:
                next = code[pos+1];
                pos++;
                break;    
            case Pachycephalo.VmCode.END:
                last_res = ["res"];
                last_res.push(Pachycephalo.printer(stack[0]))
                if (values != Pachycephalo.NULL_OBJECT){
                    var cell = values;
                    while (cell != Pachycephalo.NULL_OBJECT){
                        last_res.push(Pachycephalo.printer(cell.car));
                        cell = cell.cdr;
                    }
                }
                for (var i=1;i<last_res.length;i++){
                   console.log(last_res[i]);
                }

                vm_res = stack.pop();
                pos = next;
                break;
            case Pachycephalo.VmCode.SETG:
                global[code[pos+1]] = stack.pop();
                pos++;
                stack.push(Pachycephalo.UNDEF_OBJECT);
                break;
            case Pachycephalo.VmCode.LOADG:
                var obj = global[code[pos+1]];
                if (obj === undefined){
                    error_code[1] = "ERROR:UNDEFINED VARIABLE " + code[pos+1];
                    error_code[2] = Pachycephalo.NULL_OBJECT;
                    error_code[3] = code;
                    error_code[4] = pos;

                    code = error_code;
                    pos = -1;
                    break;
                }

                stack.push(obj);
                pos++;
                break;
            case Pachycephalo.VmCode.LOADL:
                stack.push(local_cell[code[pos+1]]);
                pos++;
                break;
            case Pachycephalo.VmCode.LOADLX:
                stack.push(local_env[code[pos+1]][code[pos+2]]);
                pos+=2;
                break;
            case Pachycephalo.VmCode.SETL:
                local_cell[code[pos+1]] = stack.pop();
                pos++;
                stack.push(Pachycephalo.UNDEF_OBJECT);
                break;
            case Pachycephalo.VmCode.SETLX:
                local_env[code[pos+1]][code[pos+2]] = stack.pop();
                pos+=2;
                stack.push(Pachycephalo.UNDEF_OBJECT);
                break;
            case Pachycephalo.VmCode.LOAD_CONST:
                stack.push(env.const_data[code[pos+1]]);
                pos++;
                break;
            case Pachycephalo.VmCode.PUSH_WIND:
                //dynamic_environments[1].push([code[pos+1],code[pos+2]]);
                dynamic_environments = new Pachycephalo.Pair([code[pos+1],code[pos+2]],dynamic_environments);
                pos+=2;
                break;

            case Pachycephalo.VmCode.POP_WIND:
                dynamic_environments = dynamic_environments.cdr;
                break;
            case Pachycephalo.VmCode.RECEIVE:
                stack.push(values);
                break;
            case Pachycephalo.VmCode.VALUES:
                 values = stack.pop();
                break;
            case Pachycephalo.VmCode.ARGS:
                var v = Pachycephalo.NULL_OBJECT;
                for (var i=0;i<code[pos+1];i++){
                    v = new Pachycephalo.Pair(stack.pop(),v);
                }
                pos++;
                stack.push(v);
                break;

            case Pachycephalo.VmCode.TAIL_CALL:
                //if (call_stack.length){
                if (call_stack){
                    //RETに置き換える?

                    //var ccell = call_stack.pop();
                    var ccell = call_stack.car;
                    call_stack = call_stack.cdr;

                    code = ccell[0];
                    pos = ccell[1];
                    local_cell = ccell[2];
                    local_env = ccell[3];
                    
                    //call_stack.pop();
                }
            case Pachycephalo.VmCode.CALL:
                var procedure = stack.pop();
                var arg = stack.pop();
    

                if (procedure.type == Pachycephalo.TYPE_PROCEDURE){

                    var _local_cell = new Array(procedure.arg1_size+1);
                    var cell = arg;
                    for (var i=0;i<procedure.arg1_size;i++){
                        if (cell == Pachycephalo.NULL_OBJECT){
                            //error;
                            error_code[1] = "ERROR:wrong number argument" + Pachycephalo.printer(procedure);
                            error_code[2] = Pachycephalo.NULL_OBJECT;
                            error_code[3] = code;
                            error_code[4] = pos;
                            code = error_code;
                            pos = -1;
                            break;

                        }
                        _local_cell[i] = cell.car;
                        if (procedure.type_check){
                            if (!(procedure.type_check[i](cell.car))){
                                throw "ERROR";
                            }
                        }
                        cell = cell.cdr;
                    }
                    
                    if (!procedure.arg2 && !(cell==Pachycephalo.NULL_OBJECT)){
                        //error
                        error("error");   
                    }

                    _local_cell[procedure.arg1_size] = cell;
                    //call_stack.push([code,pos,local_cell,local_env,procedure]);
                    call_stack = new Pachycephalo.Pair([code,pos,local_cell,local_env,procedure],call_stack);

                    local_cell = _local_cell;
                    local_env = [];
                    code = procedure.code;
                    pos = -1;

                }else if (procedure.type == Pachycephalo.TYPE_CLOSURE){
                    var proc = procedure.procedure;
                    var _local_cell = new Array(proc.arg1_size);
                    var cell = arg
                    for (var i=0;i<proc.arg1_size;i++){
                        if (cell == Pachycephalo.NULL_OBJECT){
                            error_code[1] = "ERROR:wrong number argument" + Pachycephalo.printer(procedure);
                            error_code[2] = Pachycephalo.NULL_OBJECT;
                            error_code[3] = code;
                            error_code[4] = pos;
                            code = error_code;
                            pos = -1;
                            break;
                        }
                        _local_cell[i] = cell.car;
                        cell = cell.cdr;
                    }
                    if (code == error_code){
                        break;
                    }


                    if (!proc.arg2 && !(cell==Pachycephalo.NULL_OBJECT)){
                            error_code[1] = "ERROR:wrong number argument" + Pachycephalo.printer(procedure);
                            error_code[2] = Pachycephalo.NULL_OBJECT;
                            error_code[3] = code;
                            error_code[4] = pos;
                            code = error_code;
                            pos = -1;
                            break;
                    }

                    _local_cell[proc.arg1_size] = cell;
                    //call_stack.push([code,pos,local_cell,local_env,procedure]);
                    call_stack = new Pachycephalo.Pair([code,pos,local_cell,local_env,procedure],call_stack);


                    local_cell = _local_cell;
                    local_env = procedure.local_env;
                    code = proc.code;
                    pos = -1;

                }else if (procedure.type == Pachycephalo.TYPE_CONTINUATION){
                    //継続には任意の数の引数を与えられる(多値)
                    //dynamic-windによる環境
                    var new_dynamic_environments = procedure.dynamic_environments;

                    values = Pachycephalo.NULL_OBJECT;//多値用
                    var new_code = [];//継続の脱出時に必要な処理と突入時に必要な処理用のコードをいれる。
                    {
                        var cell1 = new_dynamic_environments;
                        var cell2 = dynamic_environments;


                        var flag = null;
                        
                        var afters = [];
                        var after_new_code = [];

                        //突入時に処理するwindを追加
                        //flagに現在のwindと突入先のwindの共通部分を入れる。
                        while (cell1){
                            while (cell2){
                                if (cell1 == cell2){
                                    flag = cell2;
                                    break;
                                }
                                cell2 = cell2.cdr;
                            }

                            if (flag){
                                break;
                            }
                
                            //afters.push(cell1.car[1]);
                            stack.push(Pachycephalo.NULL_OBJECT);
                            stack.push(cell1.car[0]);
                            after_new_code.push(Pachycephalo.VmCode.CALL);
                            after_new_code.push(Pachycephalo.VmCode.POP);
                            cell1 = cell1.cdr;
                        }


                        //脱出時に処理するwindを追加
                        cell2 = dynamic_environments;
                        while (cell2){
                            if (cell2 == flag){
                                break;
                            }
                            stack.push(Pachycephalo.NULL_OBJECT);
                            stack.push(cell2.car[1]);
                            new_code.push(Pachycephalo.VmCode.CALL);
                            new_code.push(Pachycephalo.VmCode.POP);

                            cell2 = cell2.cdr;
                        }

                        for (var i=0;i<after_new_code.length;i++){
                            new_code.push(after_new_code[i]);
                        }

                        if (new_code.length){
                            //効率悪い
                            //values用のこーども追加する
                                    
                            new_code.push(Pachycephalo.VmCode.PUSH);
                            new_code.push(arg);
                            new_code.push(Pachycephalo.VmCode.PUSH);
                            new_code.push(procedure);
                            new_code.push(Pachycephalo.VmCode.CALL);
                            new_code.push(Pachycephalo.VmCode.PUSH_CODE);
                            new_code.push(code);
                            new_code.push(pos);
 
                            code = new_code;
                            pos = -1;
                            //突入先のwindとexception handlerにしておく
                            dynamic_environments = procedure.dynamic_environments;
                            exception_handlers = procedure.exception_handlers;
                        }
                    }


                    if (new_code.length == 0){
                        code = procedure.code;
                        pos = procedure.pos;
                        stack = procedure.stack;
                        /*
                        call_stack = [];
                        for (var i=0;i<procedure.call_stack.length;i++){
                            call_stack.push(procedure.call_stack[i]);
                        }*/

                        call_stack = procedure.call_stack;


                        local_cell = procedure.local_cell;
                        local_env = procedure.local_env;
                        dynamic_environments = procedure.dynamic_environments;
                        exception_handlers = procedure.exception_handlers;


                        //継続には任意の数のobjectを渡せる
                        if (arg == Pachycephalo.NULL_OBJECT){
                            stack.push(Pachycephalo.UNDEF_OBJECT);
                        }else if (arg.cdr == Pachycephalo.NULL_OBJECT){
                            stack.push(arg.car);
                        }else{
                                values = arg.cdr;
                                stack.push(arg.car);
     
                        }
                    }
                    break;

                }else if (procedure.type == Pachycephalo.TYPE_JS_PROC1){
                    var r = procedure.proc(arg,js_proc_error);
                    if (js_proc_error[0]){
                        js_proc_error[0] = false;
                        error_code[1] = js_proc_error[1];
                        error_code[2] = Pachycephalo.NULL_OBJECT;
                        error_code[3] = code;
                        error_code[4] = pos;
                        code = error_code;
                        pos = -1;

                    }else{
                        stack.push(r);
                    }
                }else if (procedure == Pachycephalo.BUILT_IN_CALL_CC){
                    var new_stack = new Array(stack.length);
                    for (var i=0;i<stack.length;i++){
                        new_stack[i] = stack[i];
                    }
                    stack.push(new Pachycephalo.Pair(new Pachycephalo.Continuation(code,pos,new_stack,call_stack,local_cell,local_env,dynamic_environments,exception_handlers),Pachycephalo.NULL_OBJECT));

                    stack.push(arg.car);
                    code = [Pachycephalo.VmCode.CALL,Pachycephalo.VmCode.PUSH_CODE,code,pos];
                    pos = -1;
                    break;
                }else if (procedure == Pachycephalo.BUILT_IN_DYNAMIC_WIND){
                    var before_proc = arg.car;
                    var body_proc = arg.cdr.car;
                    var after_proc = arg.cdr.cdr.car;
                    
                    //before/after内で継続が呼び出された場合どうなるのか?
                    //body内で複数の値が帰ってきた場合、
                    //dynamic-windの継続に正しく渡す必要がある。

                    stack.push(Pachycephalo.NULL_OBJECT);
                    stack.push(body_proc);
                    stack.push(Pachycephalo.NULL_OBJECT);
                    stack.push(before_proc);

                    var new_code = [Pachycephalo.VmCode.CALL,Pachycephalo.VmCode.POP, //beforeの実行 
                        Pachycephalo.VmCode.PUSH_WIND,before_proc,after_proc,//windの追加
                        Pachycephalo.VmCode.CALL,//bodyの実行
                        Pachycephalo.VmCode.RECEIVE,
                        Pachycephalo.VmCode.PUSH_NULL,Pachycephalo.VmCode.PUSH,after_proc,Pachycephalo.VmCode.CALL,//afterの実行
                        Pachycephalo.VmCode.POP,Pachycephalo.VmCode.POP_WIND,//afterの結果のpopと追加したwindのpop
                        Pachycephalo.VmCode.VALUES,
                        Pachycephalo.VmCode.PUSH_CODE,code,pos//コードをこのコードに書き換えたのでもとに戻す。
                    ];
                    code = new_code;
                    pos = -1;
                }else{

                    error_code[1] = "ERROR:" + Pachycephalo.printer(procedure) + " IS NOT CALLABLE  "
                    error_code[2] = Pachycephalo.NULL_OBJECT;
                    error_code[3] = code;
                    error_code[4] = pos;

                    code = error_code;
                    pos = -1;


                    break;
                }


                break;
            case Pachycephalo.VmCode.RET:
                //var ccell = call_stack.pop();
                var ccell = call_stack.car;
                call_stack = call_stack.cdr;
                code = ccell[0];
                pos = ccell[1];
                local_cell = ccell[2];
                local_env = ccell[3];
                break;
            case Pachycephalo.VmCode.CLOSURE:
                var proc = env.const_data[code[pos+1]];
                var new_local_env = [local_cell];
                for (var i=0;i<local_env.length;i++){
                    new_local_env.push(local_env[i]);
                }
                pos++;
                stack.push(new Pachycephalo.Closure(proc,new_local_env));
                
                break;
            case Pachycephalo.VmCode.CAR:
                values = Pachycephalo.NULL_OBJECT;//多値用
                var c = stack.pop();
                if (c.type != Pachycephalo.TYPE_PAIR){
                    error_code[1] = "type error. <car> required pair ,but " + Pachycephalo.printer(c);
                    error_code[2] = null;
                    error_code[3] = code;
                    error_code[4] = pos;
                    code = error_code;
                    pos = -1;
                }else{
                    stack.push(c.car);
                }
                break;
             case Pachycephalo.VmCode.CDR:
                values = Pachycephalo.NULL_OBJECT;//多値用
                var c = stack.pop();
                if (c.type != Pachycephalo.TYPE_PAIR){
                    error_code[1] = "type error. <cdr> required pair ,but " + Pachycephalo.printer(c);
                    error_code[2] = null;
                    error_code[3] = code;
                    error_code[4] = pos;
                    code = error_code;
                    pos = -1;
                }else{
                    stack.push(c.cdr);
                }
                break;
             case Pachycephalo.VmCode.IS_NULL:
                values = Pachycephalo.NULL_OBJECT;//多値用
                if (stack.pop() == Pachycephalo.NULL_OBJECT){
                    stack.push(Pachycephalo.TRUE_OBJECT);
                }else{
                    stack.push(Pachycephalo.FALSE_OBJECT);
                }
                break;
            case Pachycephalo.VmCode.IS_PAIR:
                values = Pachycephalo.NULL_OBJECT;//多値用
                if (stack.pop().type == Pachycephalo.TYPE_PAIR){
                    stack.push(Pachycephalo.TRUE_OBJECT);
                }else{
                    stack.push(Pachycephalo.FALSE_OBJECT);
                }
                break;
            case Pachycephalo.VmCode.EQV:
                var a = stack.pop();
                var b = stack.pop();
                if (a == b){
                    stack.push(Pachycephalo.TRUE_OBJECT);
                }else if (a.type != b.type){
                    stack.push(Pachycephalo.FALSE_OBJECT);
                }else{
                    if (a.type == Pachycephalo.TYPE_INTEGER && a.number == b.number){
                        stack.push(Pachycephalo.TRUE_OBJECT);   
                    }else if (a.type == Pachycephalo.TYPE_NUMBER){
                        throw "SORRY";
                    }else if (a.type == Pachycephalo.TYPE_CHAR && a.data == b.data){
                        stack.push(Pachycephalo.TRUE_OBJECT);   
                    }else if (a.type == Pachycephalo.TYPE_SYMBOL && a.data == b.data){
                        stack.push(Pachycephalo.TRUE_OBJECT);   
                    }else if (a.type == Pachycephalo.TYPE_STRING){
                        stack.push(Pachycephalo.FALSE_OBJECT);
                    }else{
                        stack.push(Pachycephalo.FALSE_OBJECT);   
                    }
                }
                break;
            case Pachycephalo.VmCode.GEN_ERROR:
                if (!exception_handlers){


                    var error_message = "";
                    error_message += "ERROR::"+code[pos+1] + "\n";
                    /*
                    for (var i=call_stack.length-1;i>-1;i--){
                        //console.log(call_stack[i][4]);
                        error_message  += "in \"" + call_stack[i][4].filename + "\" " + call_stack[i][4].line + "\n";
                    }*/

                    while (call_stack){
                      if (call_stack.car[4].filename){
                        error_message  += "in \"" + call_stack.car[4].filename + "\" " + call_stack.car[4].line + "\n";
                      }
                        call_stack = call_stack.cdr;
                    }

                    console.error(error_message);
                    return ["error",error_message];
                }else{
                    var error_object = new Pachycephalo.Error(code[pos+1],code[pos+2]);

                    stack.push(new Pachycephalo.Pair(new Pachycephalo.Pair(error_object,error_chain_proc),
                        Pachycephalo.NULL_OBJECT));
                    stack.push(exception_handlers.car);


                    exception_handlers = exception_handlers.cdr;
                    code = [
                        Pachycephalo.VmCode.CALL,
                        Pachycephalo.VmCode.GEN_ERROR,
                        "handler returned",
                        Pachycephalo.NULL_OBJECT,
                        code[pos+3],
                        code[pos+4]
                    ];
                    pos = -1;
                }   
                break;
            case Pachycephalo.VmCode.SET_EXCEPTION_HANDLER:
                var handler = stack.pop();
                var new_stack = new Array(stack.length);
                for (var i=0;i<stack.length;i++){
                    new_stack[i] = stack[i];
                }

                /*
                stack.push(new Pachycephalo.Pair(new Pachycephalo.Continuation(code,pos,new_stack,call_stack,local_cell,local_env,dynamic_environments,exception_handlers),Pachycephalo.NULL_OBJECT));
                */

                var run_handler_code = [
                    Pachycephalo.VmCode.DUP,
                    Pachycephalo.VmCode.CDR,
                    Pachycephalo.VmCode.SWAP,
                    Pachycephalo.VmCode.CAR,
                    Pachycephalo.VmCode.ARGS,1,
                    Pachycephalo.VmCode.PUSH,handler,
                    Pachycephalo.VmCode.CALL,
                    Pachycephalo.VmCode.ARGS,1,
                    Pachycephalo.VmCode.SWAP,
                    Pachycephalo.VmCode.CALL,
                    Pachycephalo.VmCode.EXIT];
                var hander_continuation = new Pachycephalo.Continuation(run_handler_code,-1,new_stack,call_stack,local_cell,local_env,dynamic_environments,exception_handlers);


                //exception_handlers = new Pachycephalo.Pair(handler,exception_handlers);
                exception_handlers = new Pachycephalo.Pair(hander_continuation,exception_handlers);
                break;
            case Pachycephalo.VmCode.POP_EXCEPTION_HANDLER:
                exception_handlers = exception_handlers.cdr;
                break;
            case Pachycephalo.VmCode.RAISE:
                var raise = stack.pop();
                if (!exception_handlers){
                    error_code[1] = "unhanded exception ::" + Pachycephalo.printer(raise);
                    error_code[2] = null;
                    error_code[3] = code;
                    error_code[4] = pos;
                    code = error_code;
                    pos = -1;
                }else{
                    stack.push(new Pachycephalo.Pair(new Pachycephalo.Pair(raise,error_chain_proc),
                        Pachycephalo.NULL_OBJECT));
                    stack.push(exception_handlers.car);

                    exception_handlers = exception_handlers.cdr;
                    code = [
                        Pachycephalo.VmCode.CALL,
                    ];
                    pos = -1;
                }
                break;

            case Pachycephalo.VmCode.MAKE_ERROR_OBJECT:
                var mes = stack.pop();
                var irritants = stack.pop();
                stack.push(new Pachycephalo.Error(mes,irritants));
                break;
            case Pachycephalo.VmCode.RAISE_CONTINUABLE:
                var raise = stack.pop();
                if (!exception_handlers){
                    error_code[1] = "unhanded exception :: " + Pachycephalo.printer(raise);
                    error_code[2] = null;
                    error_code[3] = code;
                    error_code[4] = pos;
                    code = error_code;
                    pos = -1;
                }else{

                    for (var i=0;i<stack.length;i++){
                        new_stack[i] = stack[i];
                    }

                    var handler_continuation = new Pachycephalo.Continuation(code,pos,new_stack,call_stack,local_cell,local_env,dynamic_environments,exception_handlers);

                    stack.push(new Pachycephalo.Pair(new Pachycephalo.Pair(raise,handler_continuation),
                        Pachycephalo.NULL_OBJECT));
                    stack.push(exception_handlers.car);

                    exception_handlers = exception_handlers.cdr;
                    code = [
                        Pachycephalo.VmCode.CALL,
                    ];
                    pos = -1;

                }
                break;
            case Pachycephalo.VmCode.PUSH_CODE:
                var new_code = code[pos+1];
                var new_pos = code[pos+2];
                code = new_code;
                pos = new_pos;
                break;
            case Pachycephalo.VmCode.IMPORT:
                env = stack.pop();
                enva[0] = env;
                global = env.global;
                stack.push(Pachycephalo.UNDEF_OBJECT);
                break;
            case Pachycephalo.VmCode.RESET_ENV:
                env = original_env;
                enva[0] = env;
                glolbal = env.global;
                break;
            case Pachycephalo.VmCode.LOADGX:
                var e = stack.pop();
                var obj = e.global[code[pos+1]];
                if (obj === undefined){
                    error_code[1] = "ERROR:UNDEFINED VARIABLE " + code[pos+1];
                    error_code[2] = Pachycephalo.NULL_OBJECT;
                    error_code[3] = code;
                    error_code[4] = pos;

                    code = error_code;
                    pos = -1;
                    break;
                }
                stack.push(obj);
                pos+=1;
                break;
            case Pachycephalo.VmCode.ADD_LIBRARY:
                //ライブラリ名からexportシンボルを探して、展開する
        
                var libname = stack.pop();
                var found = false;
                
                for (var i=0;i<user_libraries.length;i++){
                    if (user_libraries[i][0].data.length == libname.data.length){
                        var hit = true;
                        for (var j=0;j<libname.data.length;j++){
                            if (user_libraries[i][0].data[j].data != libname.data[j].data){
                                hit = false;
                            }
                        }
                        if (hit){
                            found = user_libraries[i][1];
                            break;
                        }
                    }
                }
                if (!found){
                    throw "not found library";
                }

                for (var i=0;i<found.export_symbols.length;i++){
                    if (found.export_symbols[i].length == 1){
                        var name = found.export_symbols[i][0];
                        env.global[name] = found.global[name];
                    }else if (found.export_symbols[i].length == 2){
                        env.global[found.export_symbols[i][1]] = found.global[found.export_symbols[i][0]];
                    }
                }

                break;
            case Pachycephalo.VmCode.SET_LIBNAME:
                user_libraries.push([stack.pop(),env]);
                break;
            case Pachycephalo.VmCode.RECORD_PREDICATE:
                var a = stack.pop();
                var b = stack.pop();
                if (b.type == Pachycephalo.TYPE_RECORD && a.data == b.record_name){
                    stack.push(Pachycephalo.TRUE_OBJECT);
                }else{
                    stack.push(Pachycephalo.FALSE_OBJECT);
                }

                break;
            case Pachycephalo.VmCode.RECORD_CONSTRUCTOR:
                var a = stack.pop();
                var b = stack.pop();
                stack.push(new Pachycephalo.Record(b,a.data));
                break;
            case Pachycephalo.VmCode.CREATE_VECTOR:
                var slen = code[pos+1];
                var vec = new Array(slen);
                for (var i=0;i<slen;i++){
                    vec[slen-i-1] = stack.pop();
                }
                stack.push(new Pachycephalo.Vector(vec));
                pos++;
                break;
            case Pachycephalo.VmCode.RECORD_TO_VECTOR:
                var a = stack.pop();
                stack.push(a.data);
                break;

            case Pachycephalo.VmCode.VECTOR_REF:
                var a = stack.pop();
                stack.push(a.data[code[pos+1]]);
                pos++;
                break;
            case Pachycephalo.VmCode.VECTOR_SET:
                var a = stack.pop();
                var b = stack.pop();
                a.data[code[pos+1]] = b;
                stack.push(Pachycephalo.UNDEF_OBJECT);
                pos++;
                break;
            case Pachycephalo.VmCode.SET_CAR:
                var a = stack.pop();
                var b = stack.pop();
                if (b.type != Pachycephalo.TYPE_PAIR){
                    error_code[1] = "type error. <set-car!> required pair but " + Pachycephalo.printer(a);
                    error_code[2] = null;
                    error_code[3] = code;
                    error_code[4] = pos;
                    code = error_code;
                    pos = -1;
                }else{
                    b.car = a;
                    b.car_circle = true;
                    stack.push(Pachycephalo.UNDEF_OBJECT);
                }
                break;
            case Pachycephalo.VmCode.SET_CDR:
                var a = stack.pop();
                var b = stack.pop();
                if (b.type != Pachycephalo.TYPE_PAIR){
                    error_code[1] = "type error. <set-cdr!> required pair but " + Pachycephalo.printer(a);
                    error_code[2] = null;
                    error_code[3] = code;
                    error_code[4] = pos;
                    code = error_code;
                    pos = -1;
                }else{
                    b.cdr = a;
                    b.cdr_circle = true;
                    stack.push(Pachycephalo.UNDEF_OBJECT);
                }
                break;
            case Pachycephalo.VmCode.ADD2:
                var a = stack.pop();
                var b = stack.pop();
                
                if (a.type == Pachycephalo.TYPE_INTEGER){
                   if ( b.type == Pachycephalo.TYPE_INTEGER){
                        stack.push(new Pachycephalo.Integer(a.number + b.number));
                   }else if (b.type == Pachycephalo.TYPE_FLOAT){
                        stack.push(new Pachycephalo.Float(a.number + b.number));
                   }else{
                        throw "SORRY";
                   }
                }else if (a.type == Pachycephalo.TYPE_FLOAT){
                    if (b.type == Pachycephalo.TYPE_INTEGER || b.type == Pachycephalo.TYPE_FLOAT){
                        stack.push(new Pachycephalo.Float(a.number + b.number));
                    }else{
                        throw "SORRY";
                    }
                }else{
                    throw "SORRY";
                }
                break;
            case Pachycephalo.VmCode.MUL2:
                var a = stack.pop();
                var b = stack.pop();

                if (a.type == Pachycephalo.TYPE_INTEGER){
                   if ( b.type == Pachycephalo.TYPE_INTEGER){
                        stack.push(new Pachycephalo.Integer(a.number * b.number));
                   }else if (b.type == Pachycephalo.TYPE_FLOAT){
                        stack.push(new Pachycephalo.Float(a.number * b.number));
                   }else{
                        throw "SORRY";
                   }
                }else if (a.type == Pachycephalo.TYPE_FLOAT){
                    if (b.type == Pachycephalo.TYPE_INTEGER || b.type == Pachycephalo.TYPE_FLOAT){
                        stack.push(new Pachycephalo.Float(a.number * b.number));
                    }else{
                        throw "SORRY";
                    }
                }else{
                    throw "SORRY";
                }

                break;
            case Pachycephalo.VmCode.SUB2:
                var b = stack.pop();
                var a = stack.pop();

                if (a.type == Pachycephalo.TYPE_INTEGER){
                   if ( b.type == Pachycephalo.TYPE_INTEGER){
                        stack.push(new Pachycephalo.Integer(a.number - b.number));
                   }else if (b.type == Pachycephalo.TYPE_FLOAT){
                        stack.push(new Pachycephalo.Float(a.number - b.number));
                   }else{
                        throw "SORRY";
                   }
                }else if (a.type == Pachycephalo.TYPE_FLOAT){
                    if (b.type == Pachycephalo.TYPE_INTEGER || b.type == Pachycephalo.TYPE_FLOAT){
                        stack.push(new Pachycephalo.Float(a.number - b.number));
                    }else{
                        throw "SORRY";
                    }
                }else{
                    throw "SORRY";
                }

                
                break;
            case Pachycephalo.VmCode.EQ2:
                var b = stack.pop();
                var a = stack.pop();
                if (a.type != b.type){
                    stack.push(Pachycephalo.FALSE_OBJECT);
                }else if (a.type == Pachycephalo.TYPE_INTEGER ){
                    if (a.number == b.number){
                        stack.push(Pachycephalo.TRUE_OBJECT);
                    }else{
                        stack.push(Pachycephalo.FALSE_OBJECT);
                    }
                }else if (a.type == Pachycephalo.TYPE_FLOAT){
                    if (a.number == b.number){
                        stack.push(Pachycephalo.TRUE_OBJECT);
                    }else{
                        stack.push(Pachycephalo.FALSE_OBJECT);
                    }
                }else{
                    error_code[1] = "number required but  " + Pachycephalo.printer(a) +  "@<procedure =>"; 
                    error_code[2] = null;
                    error_code[3] = code;
                    error_code[4] = pos;
                    code = error_code;
                    pos = -1;
                }
                break;               
            case Pachycephalo.VmCode.EQ2X:
                var b = stack.pop();
                var a = stack.pop();
                var bl = stack.pop();
                if (bl == Pachycephalo.FALSE_OBJECT){
                    stack.push(Pachycephalo.FALSE_OBJECT);
                    stack.push(a);
                }else if (a.type == Pachycephalo.TYPE_INTEGER && b.type == Pachycephalo.TYPE_INTEGER){
                    if (a.number == b.number){
                        stack.push(Pachycephalo.TRUE_OBJECT);
                        stack.push(a);
                    }else{
                        stack.push(Pachycephalo.FALSE_OBJECT);
                        stack.push(Pachycephalo.FALSE_OBJECT);
                    }
                }else{
                    throw "NSORRY";
                }
                break;               
            default:
                console.error("?CODE>>",code);
                console.error("?OPECODE>>",code[pos]);
                exit(-1);
                break;
        }
        pos++;   
    }
    return vm_res;
}


Pachycephalo.printer = function(obj){
    
    function loop(o){
        if (o.type == Pachycephalo.TYPE_PAIR){
            if (o.car_circle || o.cdr_circle){
                return "<pair>";
            }else{
                var ret = "(";
                ret += loop(o.car);
                ret += " . ";
                ret += loop(o.cdr);
                ret += ")";
                return ret;
            }
        }else if (o.type == Pachycephalo.TYPE_BOOLEAN){
            if (o == Pachycephalo.TRUE_OBJECT){
                return "#t";
            }else{
                return "#f";
            }
        }else if (o.type == Pachycephalo.TYPE_SYMBOL){
            return o.data;
        }else if (o.type == Pachycephalo.TYPE_NULL){
            return "'()";
        }else if (o.type == Pachycephalo.TYPE_INTEGER){
            return o.number;
        }else if (o == Pachycephalo.UNDEF_OBJECT){
            return "#undefined";
        }else if (o.type == Pachycephalo.TYPE_PROCEDURE){
            var res = "<procedure:arg= ";
            for (var i=0;i<o.arg1.length;i++){
                res += o.arg1[i];
                res += " ";
            }
            if (o.arg2){
                res += ". ";
                res += o.arg2;
            }
            res += ">";
            return res;
        }else if (o.type == Pachycephalo.TYPE_JS_PROC1){
            return "<procedure " + o.name + " >";
        }else if (o.type == Pachycephalo.TYPE_SPECIAL_PROCEDURE){
            return "<procedure>";
        }else if (o.type == Pachycephalo.TYPE_CLOSURE){
            var res = "#<closure:arg= ";
            for (var i=0;i<o.procedure.arg1.length;i++){
                res += o.procedure.arg1[i];
                res += " ";
            }
            if (o.procedure.arg2){
                res += ". ";
                res += o.procedure.arg2;
            }           
            res+=">";

            return res;
        }else if (o.type == Pachycephalo.TYPE_RECORD){
            return "<record " + o.record_name + ">";
        }else if (o.type == Pachycephalo.TYPE_FLOAT){
            if (o.number == Infinity){
                return "+inf.0";
            }else if (o.number == -Infinity){
                return "-inf.0";
            }else if (Math.round(o.number) === o.number){
                return o.number + ".0";
            }else{
                return o.number;
            }
        }else if (o.type == Pachycephalo.TYPE_VECTOR){
            if (o.circle){
                return "<vector>";
            }else{
                var res = "#(";
                for (var i=0;i<o.data.length;i++){
                    res += loop(o.data[i]);
                    if (i != o.data.length-1){
                        res += " ";
                    }
                }
                res += ")";
                return res;
            }
        }else if (o.type == Pachycephalo.TYPE_ERROR){
            var res = loop(o.irritants);
            return res;
        }else if (o.type == Pachycephalo.TYPE_STRING){
            return o.data;
        }else{
            return "<OBJECT " + o.type + " > ";
        }
    }
    return loop(obj);
}


    
