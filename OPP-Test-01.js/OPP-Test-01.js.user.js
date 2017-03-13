// ==UserScript==
// @name        OPP-Test-01.js
// @namespace   http://www.deans.us
// @version     1
// @grant       none
// @include       http://www.onepoliticalplaza.com/t-*
// @exclude       https://*
// @run-at        document-start
// ==/UserScript==

// took out the listener for beforescriptexecute since HTML 5 fucks with it. Just using my host file 
// to direct the bad calls to the local loop.

console.log("OPP-TopicViewer initialized.");

var base_url  = "http://www.onepoliticalplaza.com/t-";
var g_topic_state = 0;                // 1 = load-only, 2 -= extract page, 3 = extract page

var g_topic_number = 0;
var g_current_page = 0;
var g_max_post = 15;
var g_post_count = 0;
var g_topic_title;
var g_topic_pages = 0;

document.addEventListener('DOMContentLoaded', function() {

   console.log(">> EVENT : DOMContentLoaded :");
   init(1);

});

document.addEventListener('keydown', function(event) {

    if (event.keyCode == 113) {
       console.log("EVENT : keyCode-113 (F2) : single page extraction test requested.");
       init(2);  // start single page extraction (test)
    }

    if (event.keyCode == 115) {
       console.log("EVENT : keyCode-115 (F4) : multipage extraction requested.");
       init(3); // start multipage extraction
    }

    if (event.keyCode == 117) {
       console.log("EVENT : keyCode-117 (F6) : save data to file.");
       save_to_file();
    }

});

function init(opt) {

    var page_data = [];
    var post_data = [];

    if (opt < 1) {
        if (document.readyState == "interactive") {
            console.log("init(opt=" + opt + ") : document loaded : readystate = '");
            opt = 1;
        }
    }

    if (opt == 1) {                             // bounce all calls not initiated by document event listener
        console.log("window.name = '" + window.name + "'");
        if (window.name.length < 6) {
            console.log("init(opt=" + opt + ") : #001: bypassing extraction.");
            getTopicAndPage(window.location.href); 
            return 0;
        }
        else {
            console.log("init(opt=" + opt + ") : #002: extraction in progress.");
            console.log("init(opt=" + opt + ") : window.name.length = " + window.name.length);
            opt = 2;
        }
    }

    // extract
    if (opt > 1) {                              
        
        console.log("init(opt=" + opt + ") : #002: extraction requested.");

        if (opt == 3 && g_current_page > 1) {
            console.log("init(opt=" + opt + ") : navigate to the first page to start extraction.");
            return 0;     
        }

        // initialize session variable
        if (g_current_page == 1) {               
            window.name = null;
            console.log("init(opt=" + opt + ") : session variable initiated on page " + g_current_page + ", size = " + page_data.length);
            post_data = [];
            console.log("init(opt=" + opt + ") : starting post_data length = " + post_data.length);            
        }
        // get existing session veriable
        else {
            page_data = JSON.parse(window.name);
            console.log("init(opt=" + opt + ") : accumulated page_data copied from session variable " + (current_page - 1) + ". size = " + page_data.length);
            post_data = page_data[1];
            console.log("init(opt=" + opt + ") : incomming post_data length = " + post_data.length);
        }

        // topic title, topic pages and post data from document     
        page_data = processPage(document, post_data);
        topic_data = page_data[0];
        g_topic_title = topic_data[0];
        g_topic_pages = parseInt(topic_data[1],10);
        topic_status = 1;
        post_data = page_data[1];
        g_post_count = post_data.length;
        console.log("init(opt=" + opt + ") : post_count = " + g_post_count);

        if (g_post_count > g_max_post) {
            console.log("init(opt=" + opt + ") : Well then... We've jumped all the pages, haven't we?");      
            opt = 3;
        }

        if (opt == 2) {
            checkPageData(page_data, 1);
            window.name = null;
            console.log("init(opt=" + opt + ") : session variable set to null. length = " + window.name.length); 
            return 1;    
        }

    }

    // multipage extract
    if (opt > 2) {                              
        console.log("init(opt=" + opt + ") : #003: multipage extraction requested.");
    }



}

function getTopicAndPage(url) { 
       
  var idx1 = url.indexOf("/t-") + 3;
  var str1 = url.substring(idx1);

  var idx2 = str1.indexOf("-");
  var idx3 = str1.indexOf(".html");
  
  g_topic_number = str1.substring(0, idx2);
  g_current_page = parseInt(str1.substring(idx2+1,idx3), 10);   
  console.log("topic_number: " + g_topic_number + " current_page: " + g_current_page);

}

function processPage(doc, post_data) {

    var html_main;
    var page_count = 0;
    var post_count = 0;
    var ad_count = 0;

    var post_date;
    var post_link;
    var post_auth;
    var post_text;
    
    var topic_data = [];                            // title and total pages (taken from page)

    console.log("processPage() : function test...");

    post_count = post_data.length;
    console.log("processPage() : post_data.length (starting) = " + post_count);



    console.log("processPage() : test 001 : " + doc.getElementsByTagName('body')[0].children.length);

    // for some reason, the following code only works for the first page load at 15 post_data records.
    html_main = document.getElementsByTagName('body')[0].children[2];
    console.log("processPage() : pulled main element..." + html_main.nodeType);

    // topic data from page header  
    var k = parseInt(html_main.children[2].children.length,10) - 1;
    console.log("processPage() : number of nav links = " + k);
   
    // number of pages from page header
    var last_nav = html_main.children[2].children[k].textContent;
    console.log("processPage() : last nav links = " + last_nav);

    if (last_nav == ">>") {
        console.log("processPage() : not the last page.");
        topic_pages = html_main.children[2].children[k-1].textContent;  
    }
    else {
        console.log("processPage() : last page.");     
        topic_pages = html_main.children[2].children[k].textContent;    
        last_page = 1;
    }

    console.log("processPage() : pulled topic_pages... " + topic_pages);


    var topic_title = html_main.children[4].innerHTML.trim();
    console.log("processPage() : pulled topic_title... " + topic_title);

    topic_data = [topic_title, topic_pages];
    console.log("processPage() : topic data extracted...");


    // post data
    var table = html_main.children[12].children[0];
    for (var i = 1, row; row = table.rows[i]; i++) {                                          // i initialized to 1 to skip the page header row.

        post_text = "";

        if (row.querySelector(".postuserinfo").textContent.length == 1) {                       // advertisement row
            ad_count++;
            continue;
        }

        if (row.querySelector(".postuserinfo").children.length == 3) {                          // post row 1
            post_date = row.cells[0].children[2].textContent.trim();
            post_link = row.cells[0].children[1].children[0].innerHTML;
            post_count++;
        }
        else {                                                                                  // post row 2
            post_auth = row.cells[0].children[0].children[0].textContent;

            // sift through the actual elements in the post text and just get the original quotes
            var contents = row.cells[1].children[0];
            var content  = contents.firstChild;
            var cc = 0;

            while (content) {

                if (content.nodeType === Node.ELEMENT_NODE) {
                }

                if (content.nodeType === Node.TEXT_NODE) {
                    post_text += content.textContent + "<hr>";
                }

                content = content.nextSibling;
                cc++;
            }

            post_data.push([post_auth, post_date, post_link, post_text]);
            // post_data.push(["auth": post_auth, "date": post_date, "link": post_link, "text": post_text]);


            // console.log("..post recorded added to post_data: current_page=" + current_page + ", post_count=" + post_count + ", post_data size=" + post_data.length);

        }

    }  // End of Table Loop

    if (post_data.length != post_count ) {
        console.log("...may have a problem here...");
    }

    console.log("processPage() : post_data.length (ending) = " + post_count);

    return [topic_data, post_data];                                        // return page_data


}



function checkPageData(page_data, opt) {
 
    var str = "";
    console.log(".........................................................................................");
    console.log("check - topic title : " + g_topic_title);
    if (last_page) {
      str = " ( last page ).";
    }
    else {
      str = "";
    }
    console.log("check - page        : " + g_current_page + " of " + g_topic_pages + str );
    console.log("check - post        : " + g_post_count + " (of an estimated " + g_topic_pages * 15 + ")");
    console.log("check - page_data   : " + page_data.length);
   
    post_data = page_data[1];
    console.log("check - post_data   : " + post_data.length); 
   
    if (opt == 1) {
        for (var m = 0; m < post_data.length; m ++) {
           console.log("> " + post_data[m]);
           //console.log("> " + post_data.[m][0] + ", " + post_data[m][1] + ". " + post_data[m][2]);
           //console.log(post_data[m][3]);
        }  
      // console.log("> " + post_data);
    }
    console.log(".........................................................................................");
}

function save_to_file() {

    console.log("save_to_file() : function check...");

}
