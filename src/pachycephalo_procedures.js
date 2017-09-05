var is_node = typeof require !== "undefined";


var Pachycephalo_Procejures = {};

if (is_node){
    module.exports = Pachycephalo_Procejures; 
}else{
    //browser
    Pachycephalo_Procejures.pachycephalo = Pachycephalo;
}






Pachycephalo_Procejures.core0 = function(){
    const Pachycephalo = Pachycephalo_Procejures.pachycephalo;
    const VMCODE = Pachycephalo.VmCode;
    const call_with_values_code = [
        VMCODE.PUSH_NULL,
        VMCODE.LOADL,0,
        VMCODE.CALL,
        VMCODE.RECEIVE,
        VMCODE.CONS,
        VMCODE.LOADL,1,
        VMCODE.RET];

    const values_code = [
        VMCODE.LOADL,0,
        VMCODE.LOADL,1,
        VMCODE.VALUES,
        VMCODE.RET
    ];

    const with_exception_handler_code = [
        VMCODE.LOADL,0,
        VMCODE.SET_EXCEPTION_HANDLER,
        VMCODE.PUSH_NULL,
        VMCODE.LOADL,1,
        VMCODE.CALL,
        VMCODE.POP_EXCEPTION_HANDLER,
        VMCODE.RET
    ];

    const raise_continuable_code = [
        VMCODE.LOADL,0,
        VMCODE.RAISE_CONTINUABLE,
        VMCODE.RET
    ];

    const error_code = [
        VMCODE.LOADL,0,
        VMCODE.LOADL,1,
        VMCODE.MAKE_ERROR_OBJECT,
        VMCODE.RAISE
    ];

    const raise_code = [
        VMCODE.LOADL,0,
        VMCODE.RAISE
    ];

    const apply_one_code = [
        VMCODE.LOADL,
        1,
        VMCODE.LOADL,
        0,
        VMCODE.CALL,
        VMCODE.RET];

        
    var call_with_values = new Pachycephalo.Procedure(call_with_values_code,["producer","consumer"],null,0,"pachycephalo");
    var values = new Pachycephalo.Procedure(values_code,["obj1"],"obj2",0,"pachycephalo");
    var with_exception_handler = new Pachycephalo.Procedure(with_exception_handler_code,["handler","thunk"],null,0,"pachycephalo");
    var raise_continuable = new Pachycephalo.Procedure(raise_continuable_code,["obj"],null,0,"pachycephalo");
    var error = new Pachycephalo.Procedure(error_code,["message"],null,0,"pachycephalo");
    var raise = new Pachycephalo.Procedure(raise_code,["obj"],null,0,"pachycephalo");

    var apply1 = new Pachycephalo.Procedure(apply_one_code,["proc","arg"],null,0,"pachycephalo");
    
    var res = {"call-with-values":call_with_values,
               "values":values,
               "with-exception-handler":with_exception_handler,
               "raise-continuable":raise_continuable,
               "raise":raise,
               "error":error,
               "apply1":apply1};
    return res;
}


Pachycephalo_Procejures.list_library1 = function(){
    const Pachycephalo = Pachycephalo_Procejures.pachycephalo;
    const VMCODE = Pachycephalo.VmCode;
    //
    // list cons car cdr length
    //
    //

    var list_code = [VMCODE.LOADL,0,VMCODE.RET];
    var list = new Pachycephalo.Procedure(list_code,[],"obj",0,"pachycephalo");
    
    var cons_code = [VMCODE.LOADL,0,VMCODE.LOADL,1,VMCODE.CONS,VMCODE.RET];
    var cons = new Pachycephalo.Procedure(cons_code,["obj1","obj2"],null,0,"pachycephalo");

    var car_code = [VMCODE.LOADL,0,VMCODE.CAR,VMCODE.RET];
    var car = new Pachycephalo.Procedure(cons_code,["pair"],null,0,"pachycephalo");
    
    var cdr_code = [VMCODE.LOADL,0,VMCODE.CDR,VMCODE.RET];
    var cdr = new Pachycephalo.Procedure(cons_code,["pair"],null,0,"pachycephalo");

    var nullq_code = [VMCODE.LOADL,0,VMCODE.IS_NULL,VMCODE.RET];
    var nullq = new Pachycephalo.Procedure(nullq_code,["obj"],null,0,"pachycephalo");

    var pairq_code = [VMCODE.LOADL,0,VMCODE.IS_PAIR,VMCODE.RET];
    var pairq = new Pachycephalo.Procedure(pairq_code,["obj"],null,0,"pachycephalo");

    var length_fun = function(args,err){
        var cell = args.car;
        var len = 0;
        while(cell!=Pachycephalo.NULL_OBJECT){
            if (cell.type != Pachycephalo.TYPE_PAIR){
                err[0] = true;   
                err[1] = "proper list required @<procedure length>";
                return null;
            }
            len++;
            cell = cell.cdr;
        }
        return new Pachycephalo.Integer(len);
    }
    var length = new Pachycephalo.JsProcedure1("length",length_fun);

    var reverse_fun = function(args,err){
        var dic = {};
        var cell = args.car;
        var res_cell = Pachycephalo.NULL_OBJECT;
        while (cell != Pachycephalo.NULL_OBJECT){
            if (cell.type != Pachycephalo.TYPE_PAIR){
                err[0] = true;
                err[1] = "proper list required @<procedure reverse>";
                return null;
            }
            res_cell = new Pachycephalo.Pair(cell.car,res_cell);
            if (cell.cdr_circle){
                if (dic[cell]){
                    dic[cell].cdr_circle = true;
                    dic[cell].cdr = res_cell;
                    return res_cell;
                }else{
                    dic[cell] = res_cell;
                }
            }
            cell = cell.cdr;
        }
        return res_cell;
    }
    var reverse = new Pachycephalo.JsProcedure1("reverse",reverse_fun);

    var append_fun = function(args,err){
        if (args.cdr == Pachycephalo.NULL_OBJECT){
            return args.car;
        }
        var dic = {};
        var cell = args.car;
        var res_cell = new Pachycephalo.Pair(null,null);
        var res_front = res_cell;
        while (cell != Pachycephalo.NULL_OBJECT){
            if (cell.type != Pachycephalo.TYPE_PAIR){
                err[0] = true;
                err[1] = "proper list required @<procedure append>";
                return null;
            }
            if (cell.cdr_circle){
                if (dic[cell]){
                    err[0] = true;
                    err[1] = "proper list required @<procedure append>";
                    return null;
                }
                dic[cell] = true;
            }
            res_cell.cdr = new Pachycephalo.Pair(cell.car,null);
            res_cell = res_cell.cdr;
            cell = cell.cdr;
        }
        res_cell.cdr = append_fun(args.cdr,err);
        return res_front.cdr;
    }
    var append = new Pachycephalo.JsProcedure1("append",append_fun);


    var listq_fun = function(args,err){
        if (args == Pachycephalo.NULL_OBJECT){
            return Pachycephalo.NULL_OBJECT;
        }

        var cell = args.car;
        var memo = {};
        while (cell != Pachycephalo.NULL_OBJECT){
            if (cell.type != Pachycephalo.TYPE_PAIR){
                return Pachycephalo.FALSE_OBJECT;
            }
            if (memo[cell]){
                return Pachycephalo.FALSE_OBJECT;
            }
            if (cell.cdr_circle){
                memo[cell] = true;
            }
            cell = cell.cdr;
        }
        return Pachycephalo.TRUE_OBJECT;
    }

    var listq = new Pachycephalo.JsProcedure1("list?",listq_fun);


    var  res = {
        "list":list,
        "cons":cons,
        "car":car,
        "cdr":cdr,
        "length":length,
        "null?":nullq,
        "pair?":pairq,
        "reverse":reverse,
        "append":append,
        "list?":listq
    };
    return res;
}

Pachycephalo_Procejures.compare_library = function(){
    const Pachycephalo = Pachycephalo_Procejures.pachycephalo;
    const VMCODE = Pachycephalo.VmCode;

    var eqv_code = [VMCODE.LOADL,0,VMCODE.LOADL,1,VMCODE.EQV,VMCODE.RET];
    var eqv = new Pachycephalo.Procedure(eqv_code,["obj1","obj2"],null,0,"pachycephalo");

    {
        //equal?の実装
        
        var k0 = 200;
        var kb = -20;

        
        function find(b){
            const n = b[0];
            if (Array.isArray(n)){
                var _b = b;
                var _n = n;
                while (1){
                    var nn = _n[0];
                    if (Array.isArray(nn[0])){
                        _b[0] = nn;
                        _b = n;
                        _n = nn;
                    }else{
                        return n;
                    }
                }
            }
            return b;
        }

        function union(x,y,hash){
            var bx = hash[x];
            var by = hash[y];

            if (!bx){
                if (!by){
                    //xもyも未所属
                    hash[x] = [1];
                    hash[y] = [1];
                    return false;
                }else{
                    //xのみ未所属
                    var ry = find(by);
                    hash[x] = ry;
                    return false;
                }
            }else{
                if (!by){
                    //yのみ未登録
                    var rx = find(bx);
                    hash[y] = ry;
                    return false;
                }else{
                    //xもyも登録済み
                    var rx = find(bx);
                    var ry = find(by);
                    if (rx == ry){
                        return true;
                    }

                    if (rx[0] > ry[0]){
                        ry[0] = rx;
                        rx[0] += ry[0];
                    }else{
                        rx[0] = ry;
                        ry[0] += rx[0];   
                    }
                    return false;
                }
            }
        }

        function xeq(a,b){
            if (a == b){
                return true;
            }else if (a.type != b.type){
                return false;
            }else if (a.type == Pachycephalo.TYPE_INTEGER){
                return a.number == b.number;
            }else if (a.type == Pachycephalo.TYPE_SYMBOL){
                return a.data == b.data;
            }else if (a.type == Pachycephalo.TYPE_FLOAT){
                return a.number == b.number;
            }
            //未完成
            return false;
        }



        function interleave(a,b,hash){
            var k = k0;
            var x = a;
            var y = b;
            var res = k;

            var stack = [];
            stack.push([x,y,k,0]);
            while (stack.length){
                var c = stack.pop();
                if (c[3] == 1){
                   stack.push([c[0].cdr,c[1].cdr,res,0]);
                }else if (c[3] == 2){
                    if (c[4] < c[0].data.length){
                        stack.push(c);
                        stack.push([x.data[c[4]],y.data[c[4]],res,0]);
                        c[4]++;
                    }
                }else if (xeq(c[0],c[1])){
                    //pass
                    res = k;
                }else if (c[0].type != c[1].type){
                    return false;
                }else if (c[0].type == Pachycephalo.TYPE_STRING){
                    if (x.data != y.data){
                        return false;
                    }
                    res = k;
                }else{
                    if (c[0].type != Pachycephalo.TYPE_VECTOR && c[0].type != Pachycephalo.TYPE_PAIR){
                        return false;
                    }
                    x = c[0];
                    y = c[1];
                    k = c[2];
                    
                    if (k > 0){
                        //fast
                        if (x.type == Pachycephalo.TYPE_PAIR){
                            stack.push([x,y,k,1]);
                            stack.push([x.car,y.car,k-1,0]);
                        }else{
                            if (x.data.length != y.data.length){
                                return false;
                            }   
                            stack.push([x,y,k-1,2,0]);
                        }  
                    }else if (k == kb){
                        //fast init
                        stack.push([x,y,k0,0]);
                    }else{
                        //slow
                        if (x.type == Pachycephalo.TYPE_PAIR){
                            if (union(x,y,hash)){
                                res = 0;
                            }else{
                                stack.push([x,y,k-1,1]);
                                stack.push([x.car,y.car,k-1,0]);
                            }
                        }else {
                            if (x.data.length != y.data.length){
                                return false;
                            }
                            if (union(x,y)){
                                res = 0;
                            }else{
                                stack.push([x,y,k-1,2,0]);
                            }
                        }
                    }

                }

            }
            
            return true;
        }

               
 
        var equal_fun = function(args,err){
            var x = args.car;
            if (args.cdr == Pachycephalo.NULL_OBJECT){
                err[0] = true;
                err[1] = "wrong number argument <@equal?>";
            }
            var y = args.cdr.car;
            var hash = {};
            


            if (interleave(x,y,hash)){
                return Pachycephalo.TRUE_OBJECT;
            }else{
                return Pachycephalo.FALSE_OBJECT;
            }
        }
        var equal = new Pachycephalo.JsProcedure1("equal",equal_fun);
    }

    var  res = {
        "eqv?":eqv,
        "eq?":eqv,
        "equal?":equal
    };
    return res;
}


