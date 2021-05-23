function T$(id){return document.getElementById(id);}
function T$$(elem, select){return elem.querySelectorAll(select);}

(function(){  
  this.plaginTable = function(param){
    if(!(this instanceof plaginTable)) return new plaginTable(arguments);    
    this.init.apply(this, arguments);
    this.sortTable();
    this.RowEvenOdd();
    this.CreateFilter();      
    this.CreatePageCount();
    this.CreateSelectedLabel();
  };
  plaginTable.prototype ={ 
    // инициализация плагина (обработка параметров)   
    init: function(param){      
      this.id = param[0];
      this.options = {
        sortColumn: param[1].sortColumn-1 || 0,
        Sorting: param[1].Sorting===undefined?true:param[1].Sorting,
        EvenOdd: param[1].EvenOdd===undefined?true:param[1].EvenOdd,
        Filter: param[1].Filter===undefined?true:param[1].Filter,
        HeadFix: param[1].HeadFix===undefined?true:param[1].HeadFix,
        CountLabel: param[1].CountLabel===undefined?true:param[1].CountLabel,
        ListCount: param[1].ListCount===undefined?true:param[1].ListCount,
        code: '',    
        PagSize: 0,
        PagPage: 1,
        PagStep: param[1].PagStep || 3, // количество страниц отображаемых от центра в пагинаторе
        StartVall: 1,
        CountValue: param[1].CountValue || 25,
        EndVall: 0,
      };
      window.addEventListener("scroll", this.scrollWin.bind(this), false);
      T$(this.id).addEventListener("click", this.clickTable.bind(this), false);         
    },
    // обработка заголовков с классом NoSort
    NosortTest: function(){
      var count=0;
      var th=T$$(T$(this.id), "thead th");
      while (th[this.options.sortColumn].classList.contains('nosort')){
        count++;
        if(count==th.length) return;
        this.options.sortColumn++;       
      }
    },    
    // метки сортировки в шапку таблицы
    LabelSort: function(){      
      var th = T$$(T$(this.id), "thead th");
      if(th[this.options.sortColumn].classList.contains('nosort')){this.options.Sorting=false; return 0;}
      if(th[this.options.sortColumn].classList.contains('asc')) {
        th[this.options.sortColumn].classList.remove('asc');          
        th[this.options.sortColumn].classList.add('dsc');          
      }
      else {
        for(var i=0; i<th.length; i++){              
          th[i].classList.remove('asc');         
          th[i].classList.remove('dsc'); 
          if(!(th[i].classList.contains('nosort'))) th[i].classList.add('getsort');              
        }
        th[this.options.sortColumn].classList.add('asc');
        th[this.options.sortColumn].classList.remove('getsort');
      } 
      return 1;              
    },
    //скрипт сортировки таблицы
    sortTable: function(){         
      if(!this.options.Sorting) return;                  
      this.NosortTest();
      var lbSort = this.LabelSort();
      if(lbSort==0) return;
      var tbody = T$$(T$(this.id),"tbody")[0];
      var th = T$$(T$(this.id), "thead th");      
      // Составить массив из TR
      var rowsArray = Array.from(T$$(T$(this.id), "tbody tr")); 
      for(var q=0; q<rowsArray.length; q++){
        if(!T$$(rowsArray[q],"td")[this.options.sortColumn].classList.contains('sort')){
          for(var w=0; w<rowsArray[q].getElementsByTagName('td').length;w++){
            T$$(rowsArray[q],"td")[w].classList.remove("sort");
          }
          T$$(rowsArray[q],"td")[this.options.sortColumn].classList.add("sort");
        }
      }   
      if(th[this.options.sortColumn].classList.contains('asc')) rowsArray.sort(this.CustomSort.bind(this));
      if(th[this.options.sortColumn].classList.contains('dsc')) rowsArray.sort(this.CustomSort.bind(this)).reverse();     
      T$(this.id).removeChild(tbody);
      for (var i = 0; i < rowsArray.length; i++) tbody.appendChild(rowsArray[i]);
      T$(this.id).appendChild(tbody);
    },
    //событие клик по таблице
    clickTable: function(e){ 
      var rowArr = T$$(T$(this.id), "tbody tr");
      var divSearch =T$("searchBlock" + this.id);
      if(divSearch!=null) {
        T$$(divSearch,"input")[0].value = '';
        if(T$$(divSearch,"button")[0]!=null){ 
          this.deleteBtnReset();
          this.ShowSelectedItem();
          this.PaginStart();
          this.CreateSelectedLabel();
        }
      }
      if (e.target.tagName == 'TH'){
        if (e.target.classList.contains('nosort') || e.target.className == "") return;
        this.options.sortColumn = e.target.cellIndex;        
        this.sortTable();
        this.ShowSelectedItem();       
        if(document.querySelector('#fixed') != null && document.querySelector('#fixed').classList.contains(this.id)) this.UpdateHeaderFixed(e.target.parentElement.parentElement.parentElement);
        this.RowEvenOdd();
      }  
      // активная строка выделяется по нажатию
      if (e.target.tagName == 'TD'){
        if(!e.target.parentElement.classList.contains('active')){
          for(var i=0;i<rowArr.length;i++) rowArr[i].classList.remove('active');
          e.target.parentNode.classList.add('active');
        } 
        else e.target.parentElement.classList.remove('active'); 
      }     
    },
    // правило для сортировки    
    CustomSort: function (rowA, rowB){
      //дата
      var datetime_regex = /(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})/;
      var first_date_arr = datetime_regex.exec(rowA.cells[this.options.sortColumn].innerHTML);     
      var second_date_arr = datetime_regex.exec(rowB.cells[this.options.sortColumn].innerHTML);
      if(first_date_arr != null && second_date_arr != null) {
        var first_datetime = new Date(first_date_arr[3], first_date_arr[2], first_date_arr[1]);     
        var second_datetime = new Date(second_date_arr[3], second_date_arr[2], second_date_arr[1]);     
        if(first_datetime>second_datetime) return 1;
        if(first_datetime === second_datetime) return 0;
        return -1;
      }
      // дробные числа
      var price_regex = /([0-9]*.[0-9]*)*[\.\/\-][0-9]*/;
      var slesh = /\,\.\/\-/;
      var str = rowA.cells[this.options.sortColumn].innerHTML;    
      str = str.replace(/\s+/g, '');
      str = str.replace(/\,/,".");    
      var str2 = rowB.cells[this.options.sortColumn].innerHTML;
      str2 = str2.replace(/\s+/g, '');
      str2 = str2.replace(/[\,\.\-\/]/g,".");
      if (isNaN(str - str2)) {
        if (str === str2) return 0;
        if (str > str2) return 1;
        return -1;
      }
      else {
        if (str === str2) return 0;
        if (str - str2 > 0) return 1;
        return -1;  
      } 
    },
    // разметка на четные и не четные
    RowEvenOdd: function () {
      if(this.options.EvenOdd){ 
        var rowArr = T$$(T$(this.id), "tbody tr");    
        for(var i=0; i<rowArr.length; i += 2){
          rowArr[i].classList.remove("odd");
          rowArr[i].classList.add("even");
        }
        for(var i=1; i<rowArr.length; i += 2){
          rowArr[i].classList.remove("even");
          rowArr[i].classList.add("odd");
        }
      } 
    },
    // --------------------
    //    Поиск
    // --------------------
    // создаем поле Поиска
    CreateFilter: function (){
      if(this.options.Filter) {
        var blockTabelTop = T$("blockTabelTop"+this.id);
        if(!blockTabelTop) {
            blockTabelTop = document.createElement('div');
            blockTabelTop.setAttribute("id", "blockTabelTop" + this.id);
        }
        var div = document.createElement('div');
        div.setAttribute("id", 'searchBlock'+this.id);
        document.body.insertBefore(blockTabelTop, T$(this.id));            
        var labFilter = document.createElement('label');
        var inpFilter = document.createElement('input');            
        labFilter.innerHTML = "Искать: ";            
        inpFilter.type = "text";
        blockTabelTop.appendChild(div);
        div.appendChild(labFilter);
        div.appendChild(inpFilter);        
        inpFilter.addEventListener("input", this.inpFilterInput.bind(this), false)
      }
    },
    createBtnReset:function(){
      var divSearch =T$("searchBlock" + this.id);      
      var btnX = document.createElement("button");
      btnX.type = "reset";
      btnX.title = "Нажмите чтобы очистить поле"; 
      btnX.innerHTML = "X";     
      if(T$$(divSearch, "button")[0]==null) divSearch.appendChild(btnX);
      btnX.addEventListener("click", this.clickClearBtn.bind(this), false);
    },
    clickClearBtn: function(e){
      T$$(T$("searchBlock" + this.id),"input")[0].value = '';
      this.deleteBtnReset();
      this.ShowSelectedItem();
      this.PaginStart();
      this.CreateSelectedLabel();      
    },
    deleteBtnReset:function(){
      var divSearch =T$("searchBlock" + this.id);
      var btnX = T$$(divSearch, "button")[0];
      divSearch.removeChild(btnX);
    },
    // событие ввода в поле поиска
    inpFilterInput: function(e) { 
      var cnt=0;   
      this.options.PagPage = 1;  
      var words = e.target.value.toLowerCase().split(" ");        
      if(words!="") {
        this.createBtnReset();
      }
      else {
        this.deleteBtnReset();
      }      
      for (var r = 1; r < T$(this.id).rows.length; r++){
        var displayStyle = 'none';
        for (var i = 0; i < words.length; i++) {
            if (T$(this.id).rows[r].innerHTML.replace(/<[^>]+>/g,"").toLowerCase().indexOf(words[i])>=0) {
              displayStyle = '';
              cnt++;
            }
            else {
              displayStyle = 'none';          
              break;          
            }
        }        
        T$(this.id).rows[r].style.display = displayStyle;                       
      }      
      if(cnt==0) this.options.StartVall=0; else this.options.StartVall=1;
      if(cnt<this.options.CountValue){ 
        this.options.EndVall = cnt;
        this.RemovePagination();
        this.CreateSelectedLabel();
      }
      if(cnt>=this.options.CountValue){
        this.options.EndVall=this.options.CountValue;
        this.PaginStart();
        this.CreateSelectedLabel();
      }      
    },
    // --------------------
    // Фиксированная шапка
    // -------------------- 
    //функция получения номера таблицы по порядку при скроллинге видимой на странице
    GetNumTableView: function (scrolled){  
      var tbl = document.querySelectorAll("table");
      for(var i=0; i<tbl.length; i++){ 
        if(scrolled<=tbl[i].offsetTop) return 0;
        if(scrolled>tbl[i].offsetTop && scrolled<(tbl[i].offsetHeight+tbl[i].offsetTop)) return i;
      }
      return -1;
    },
    // событие скролла окна
    scrollWin: function(){
      var scrolled = window.pageYOffset || document.documentElement.scrollTop;                            
      var k = this.GetNumTableView(scrolled);
      var tbl = document.querySelectorAll("table");                
      if(k>=0 && scrolled>tbl[k].offsetTop && scrolled<(tbl[k].offsetHeight+tbl[k].offsetTop)) {          
        if(document.querySelector('#fixed') == null && this.options.HeadFix) {
          if(tbl[k]===T$(this.id)) this.CreateTableFixed();
          else this.DeleteTableFixed();
        }
      }                                 
      else this.DeleteTableFixed();
    },   
    // создаем фиксированную шапку  
    CreateTableFixed: function (){
      var FixedTabel = document.createElement('table');        
      var thead = document.createElement('thead');
      document.body.insertBefore(FixedTabel, T$(this.id));    
      FixedTabel.appendChild(thead);      
      this.UpdateHeaderFixed(FixedTabel);
      //событие клик на заголовок таблицы
      FixedTabel.addEventListener("click", this.clickTable.bind(this), false);
    },
    // удаляем фиксированную шапку
    DeleteTableFixed: function (){        
      if(document.querySelector('#fixed') != null) {          
        document.body.removeChild(document.querySelector('#fixed'));
      }
    },
    // обновляем фиксированную шапку
    UpdateHeaderFixed: function (newGrid){ 
      var copy = T$(this.id).querySelector('thead').cloneNode(true);
      newGrid.replaceChild(copy, newGrid.querySelector('thead'));
      newGrid.setAttribute("id", "fixed");  
      newGrid.setAttribute("class", this.id);     
      newGrid.style.left = T$(this.id).offsetLeft+'px';      
      newGrid.style.top = 0;
      newGrid.style.position = 'fixed'; 
      newGrid.style.zIndex = 101;
      var thOld = T$$(T$(this.id),'th'); 
      var thNew = T$$(newGrid,'th');
      for(var w=0; w<thNew.length; w++) {
        thNew[w].style.width=thOld[w].clientWidth+(thOld[w].offsetWidth-thOld[w].clientWidth)+'px';
      }
    },
    // создаем метку колисчества элементов и страниц
    CreateSelectedLabel: function(){        
      if(this.options.CountLabel){        
        var rowArr = T$$(T$(this.id), "tbody tr"); 
        var lablPage =''; 
          
        if(T$('pagination'+this.id)!=null){
          var a = document.querySelector('#pagination'+this.id+" span a.current");
          this.options.StartVall = a.innerHTML*this.options.CountValue-this.options.CountValue+1;          
          this.options.EndVall = a.innerHTML*this.options.CountValue;
          if(this.options.EndVall>rowArr.length) this.options.EndVall = rowArr.length;           
          lablPage = "Страница № " + a.innerHTML+" из " + this.options.PagSize + ";  ";          
        }
        else {
          this.options.StartVall = 1;          
          if(this.options.EndVall == 0){
            this.options.StartVall = 0;
            this.options.EndVall = 0;
          }
          else {            
            if(this.options.EndVall>this.options.CountValue)this.options.EndVall = rowArr.length;            
          }
        }        
        if(T$('selcount'+this.id)==null){
          var lab = document.createElement('label');
          lab.setAttribute('id', 'selcount'+this.id);          
          document.body.insertBefore(lab, T$(this.id).nextSibling);
        }        
        T$('selcount'+this.id).innerHTML = lablPage+'Показано ' + this.options.StartVall + '-' + this.options.EndVall + ' из '+rowArr.length+' элементов'; 

      }        
    }, 
    // --------------------
    // Количество элементов на странице
    // -------------------- 
    //создать список
    CreatePageCount: function(){        
      if(this.options.ListCount){
        var rowArr = T$$(T$(this.id), "tbody tr");       
        var blockTabelTop = document.getElementById("blockTabelTop"+this.id);
        if(!blockTabelTop) {
          blockTabelTop = document.createElement('div');
          blockTabelTop.setAttribute("id", "blockTabelTop" + this.id);
        } 
        var selCount = document.createElement('select');
        var labelCount = document.createElement('label');
        var div = document.createElement('div');        
        div.setAttribute("id", "countBlock" + this.id);
        labelCount.innerHTML = "Количество объектов на странице: "; 
        document.body.insertBefore(blockTabelTop, T$(this.id));
        blockTabelTop.appendChild(div);
        div.appendChild(labelCount);
        div.appendChild(selCount);    
        var val=0;
        var f=0;
        for(var i=0; i<4; i++){      
          var optionCount = document.createElement('option');
          val=val+25;           
          optionCount.setAttribute('value', val);                
          if(val==this.options.CountValue) {                
            optionCount.setAttribute('selected', 'selected');
            f++;
          }
          optionCount.innerHTML = val;      
          selCount.appendChild(optionCount);    
        }
        var opt=selCount.querySelectorAll('option');
        if(f == 0){
          opt[0].setAttribute('selected', 'selected');             
          this.options.CountValue=opt[0].value;          
        }
        this.options.PagSize = Math.ceil(rowArr.length / this.options.CountValue);
        this.PaginStart();        
        selCount.addEventListener("change", this.PageCountChange.bind(this), false);
      } 
    },
    // событие выбора из списка
    PageCountChange: function(e){
      var rowArr = T$$(T$(this.id), "tbody tr");
      this.options.CountValue = e.target.value;
      this.options.PagSize = Math.ceil(rowArr.length / this.options.CountValue);
      if(this.options.PagPage>this.options.PagSize)this.options.PagPage=1;      
      this.PaginStart();
      this.CreateSelectedLabel();
    },
    //отображать нужные элементы, скрыть не нужные
    ShowSelectedItem: function (){
      if(this.options.ListCount){
        this.options.StartVall = this.options.CountValue*(this.options.PagPage-1)+1;
        this.options.EndVall = this.options.CountValue*this.options.PagPage;
        var rowArr = T$(this.id).querySelectorAll('tbody tr');
        if(this.options.EndVall>rowArr.length) this.options.EndVall = rowArr.length; 
        for(var i=0; i<rowArr.length; i++) {
          rowArr[i].style.display = 'none';
        }
        for(var i=this.options.CountValue*(this.options.PagPage-1); i<this.options.CountValue*this.options.PagPage && i<rowArr.length; i++) {
          rowArr[i].style.display = '';
        }
      }
    }, 
    //--------------------
    // Пагинация
    //--------------------
    // add first page with separator
    First: function(){this.options.code += '<a>1</a><i>...</i>';},
    // add pages by number (from [s] to [f])
    Add: function(s, f){for (var i = s; i < f; i++) this.options.code += '<a>' + i + '</a>';},
    // add last page with separator
    Last: function () {this.options.code += '<i>...</i><a>' + this.options.PagSize + '</a>';},
    // previous page
    Prev: function(){        
      this.options.PagPage--;        
      if (this.options.PagPage < 1) this.options.PagPage = 1;        
      this.PaginStart();
      this.CreateSelectedLabel(); 
    },
    // next page
    Next: function(){
      this.options.PagPage++;
      if (this.options.PagPage > this.options.PagSize) this.options.PagPage = this.options.PagSize;            
      this.PaginStart();
      this.CreateSelectedLabel();
    },
    // change page
    Click: function(e){
      this.options.PagPage = +e.target.innerHTML;
      this.PaginStart();    
      this.CreateSelectedLabel();      
    },
    // binding buttons
    Buttons: function(e){             
      var nav = T$$(e, 'a');
      nav[0].addEventListener('click', this.Prev.bind(this), false);
      nav[1].addEventListener('click', this.Next.bind(this), false);
    },
    // binding pages
    Binder: function () {
      var e = T$('pagination'+this.id).querySelector('span');
      var a = T$$(e, 'a');
      for (var i = 0; i < a.length; i++) {            
        if (+a[i].innerHTML === this.options.PagPage) a[i].className = 'current';
        self=this;
        a[i].addEventListener('click', this.Click.bind(this), false);      
      }
    },
    // удаление блока пагинатора
    RemovePagination: function(){     
      var pagin = T$('pagination'+this.id);
      if (pagin != null) document.body.removeChild(pagin);
    },
    // создать блок пагинатора
    CreatePagination: function(){        
      var pagin = T$('pagination'+this.id);
      if (pagin != null) return;
      var e = document.createElement('div');        
      e.setAttribute("id", 'pagination'+this.id);       
      document.body.insertBefore(e, T$(this.id).nextSibling);   
      var html = [
        '<a>&#9668;</a>', // previous button
        '<span></span>',  // pagination container
        '<a>&#9658;</a>'  // next button
      ];
      e.innerHTML = html.join('');       
      this.Buttons(e);
    },
    // find pagination type
    PaginStart: function(){
      if (this.options.PagPage < this.options.PagStep * 2 + 6) this.Add(1, this.options.PagSize + 1);
        else if (this.options.PagPage < this.options.PagStep * 2 + 1){
        this.Add(1, this.options.PagStep * 2 + 4);
        this.Last();
      }
      else if (this.options.PagPage > this.options.PagSize - this.options.PagStep * 2) {
        this.First();
        this.Add(this.options.PagSize - this.options.PagStep * 2 - 2, this.options.PagSize + 1);
      }
      else {
        this.First();
        this.Add(this.options.PagPage - this.options.PagStep, this.options.PagPage + this.options.PagStep + 1);
        this.Last();
      }      
      this.ShowSelectedItem();
      this.CreatePagination();
      this.Finish();        
      if(this.options.PagSize<2) this.RemovePagination();      
      if(T$("pagination"+this.id) != null) {
        var nav = T$$(T$("pagination"+this.id), 'a');
        if(this.options.PagPage == 1) nav[0].classList.add('disabled');   
        else nav[0].classList.remove('disabled');
        if(this.options.PagPage == this.options.PagSize) nav[nav.length-1].classList.add('disabled');   
        else nav[nav.length-1].classList.remove('disabled');
      }            
    },
    // write pagination
    Finish: function(){
      var e = T$('pagination'+this.id).querySelector('span');          
      e.innerHTML = this.options.code;
      this.options.code = '';
      this.Binder();
    },   
  }
  return plaginTable;
}());