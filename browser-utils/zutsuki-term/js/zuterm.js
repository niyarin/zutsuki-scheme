var Zuterm = {};

Zuterm.global = {};

Zuterm.Zuterm = function(elem,input){
    this.elem = elem;
    this.input = input;
    this.pt = ">>> ";//prompt 
    this.opening = "Zutsuki-Scheme  REPL<br><font color='#888888'>by niyarin</font><br> ";

    this.input_fun = function(text,term){
        term.output_fun(text);
    }

    this.output_fun = function(text){
        Zuterm.output_term(this,text);
    }

    this.error_fun = function(text){
        Zuterm.error_term(this,text);
    }

}


Zuterm.output_term = function(term,text){
    term.elem.appendChild(document.createTextNode(text));//inner_elementの中身をelemに挿入
    term.elem.appendChild(document.createElement("br"));//改行を挿入
}

Zuterm.error_term = function(term,text){
    var error_elem = document.createElement("span");
    error_elem.className = "error";
    error_elem.innerText = text;
    term.elem.appendChild(error_elem);
    term.elem.appendChild(document.createElement("br"));//改行を挿入
}


Zuterm.insert_prompt = function(zuterm,pt){
    var pt_elem = document.createElement("span");
    pt_elem.className = "prompt";
    pt_elem.innerText = pt;
    zuterm.appendChild(pt_elem);
}


Zuterm.insert_opening = function(zuterm,opening){
    var opening_elem = document.createElement("span");
    opening_elem.innerHTML = opening;
    zuterm.appendChild(opening_elem);
    zuterm.appendChild(document.createElement("br"));
}


Zuterm.create_Zuterm = function(elem){
    var res = new Zuterm.Zuterm(elem);


    Zuterm.insert_opening(elem,res.opening);

    Zuterm.insert_prompt(elem,res.pt);
    
    var input_element = document.createElement("span");
    {
        elem.appendChild(input_element);
        input_element.contentEditable = true;
        input_element.innerText = "";

        //input_element.style.backgroundColor = "#ff0000";
        input_element.style.height = "30px";
        input_element.style.caretColor = "#eeeeee";
        input_element.style.outline = "0";
        input_element.style.spellcheck = false;

        input_element.focus();
    }


    {
        input_element.onkeyup = function(e){
            switch (e.keyCode){
                case 13:
                    var line_data = input_element.innerText;
                    elem.removeChild(input_element);
                    elem.appendChild(document.createTextNode(line_data));//inner_elementの中身をelemに挿入
                    elem.appendChild(document.createElement("br"));//改行を挿入
                    
                    
                    res.input_fun(line_data,res);

                    Zuterm.insert_prompt(elem,res.pt);
                    
                    input_element.innerText = "";//inner_elementを空にする
                    elem.appendChild(input_element);//inner_elementを再挿入
                    input_element.focus();//inner_elementにfocusを入れる
                    break;
            }
        }
    }



    {
        elem.onclick = function(){
            if (document.activeElement !== input_element){
                input_element.focus();
            }
        }
    }

    

    return res;
}


Zuterm.init= function(){
    var elems = document.getElementsByClassName("zuterm");
    for (var i=0;i<elems.length;i++){
        Zuterm.global[elems.item(i)] = Zuterm.create_Zuterm(elems.item(i));
    }
}

Zuterm.get_term_from_id = function(id_name){
    var elem_obj = document.getElementById(id_name);
    var term_obj = Zuterm.global[elem_obj];
    if (term_obj){
        return term_obj;
    }else{
        return null;
    }
}
