;boolean
(define (not o)
  (if o #f #t))

;list
(define (list-tail list k)
  (let loop ((ls list)
             (i k))
    (cond 
      ((= i 0) ls)
      ((null? ls) (error "index error  @<procedure list-tail>"))
      (else (loop (cdr ls) (- i 1))))))


(define (make-list k . opt)
  (let ((fill (if (pair? opt) (car opt) #f)))
    (let loop ((i k) (res '()))
      (if (= i 0)
        res
        (loop (- i 1) (cons fill res))))))


(define (list-set! list k obj)
  (let loop ((i k)(ls list))
    (cond
      ((= i 0) (set-car! ls obj))
      ((null? ls) (error "index error @<procedure list-set!>"))
      (else (loop (- i 1)(cdr ls))))))



(define (member obj list . opt)
  (let ((comp (if (pair? opt) (car opt) equal?)))
    (let loop ((ls list))
      (cond
        ((null? ls) #f)
        ((comp obj (car ls)) ls)
        (else (loop (cdr ls)))))))


(define (memq obj list)
  (member obj list eq?))

(define (memv obj list)
  (member obj list eqv?))

(define (assoc obj alist . opt)
  (let ((comp (if (pair? opt) (car opt) equal?)))
    (let loop ((als alist))
      (cond 
        ((null? als) #f)
        ((not (pair? (car als))) (error "pair requird @<procedure assoc>"))
        ((comp (caar als) obj) (car als))
        (else (loop (cdr als)))))))
 

(define (assv obj alist)
  (assoc obj alist eqv?))

(define (assq obj alist)
  (assoc obj alist eq?))



(define (caar pair) (car (car pair)))

(define (apply proc . args)
  (when (null? args) (error "wrong number of arguments @<procedure apply>"))
  (apply1 proc
    (let loop ((ls args))
      (if (null? (cdr ls))
        (car ls)
        (cons (car ls) (loop (cdr ls)))))))






