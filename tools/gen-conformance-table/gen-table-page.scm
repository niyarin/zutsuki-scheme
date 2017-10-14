(define (r7rs-ct-table? obj)
   (and (list? obj)
        (= (length obj) 3)
        (boolean? (caddr obj))))




(define html-head "
<style>
table {
        border-collapse: collapse;
}
td {
        border-bottom: solid 1px;
        padding: 0.5em;
}

td.blue {
    background:  #F5F5AA;
}

td.red {
    background:  #F5F5DC;
}


</style>


<div Align='center'>

<table>")


(define html-tail "</div></table><br><br>")





(define (conv-table data nest)
   (if (caddar data)

      (let ([current-dt 
             (if (zero? nest)
                "<td class='blue'>"
                "<td class='red'>")])

         (display "<tr>")
         (newline)
         (when (> nest 0) (display current-dt)(display "</td>")(newline))
         (display current-dt)
         (display (caar data))
         (display (cadar data))
         (display "</td>")
         (newline)

         (for-each
            (lambda (_) (display current-dt)(display "</td>"))
            (make-list (- 3 nest) #f))



         (display "</tr>")
         (newline)

         (for-each 
            (lambda (x)
               (display "<tr>")
               (display "<td></td><td></td>")
               (display "<td>")
               (display (car x))
               (display "</td>")
               (display "<td>")
               (cond
                 ((= (cadr x) 2) (display "<img src='check.png'>"))
                 ((= (cadr x) 1) (display "<img src='delta.png'>"))
                  )

               (display "</td>")

               (display "</tr>")
               (newline)
               )
            (cdr data))
         )

      (begin
         (display "<tr>")
         (newline)
         (display "<td class='blue'>")
         (display (caar data))
         (display (cadar data))
         (display "</td>")
         (newline)

         (display "<td class='blue'></td>")
         (display "<td class='blue'></td>")
         (display "<td class='blue'></td>")

         (display "</tr>")
         (newline)
         
         (for-each (lambda (x) (conv x (+ nest 1)))
                   (cdr data))
         )

      ))


(define (conv data nest)
   (if (r7rs-ct-table? (car data))
      (conv-table data nest)
      (for-each 
         (lambda (x) (conv x nest))
         (cdr data))
      ))


(define (run)
   (let ([data (read)])
      (unless (eqv? (car data) 'r7rs-small) (error "invalid input"))
      (display html-head)
      (conv data 0)
      (display html-tail)
   ))

(run)
