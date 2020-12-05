
/*

TODO:
1. maximise
2. windowed from maximized/minimized state
3. editor container resize handler

*/
(function($) {
  $.fn.resizeTab = function(action) {
      if (action == 'minimize') {
        $(this).width(25).data('ui-tab-resize-status','minimized').resize();
        // $(this).find('.editor-header').hide();
        $(this).find('.editor-left').width(25).height('100%');
        $(this).find('.editor-left-text').removeClass('hide');
        // $(this).find('.spell-editor').hide();
      }
      else if (action == 'open') {
        $(this).removeData('ui-tab-resize-status').resize();
        $(this).find('.spell-editor').show();
        // $(this).find('.editor-header').show();
        $(this).find('.editor-left').removeClass('tab-border').width(5).height('100%');
        $(this).find('.editor-left-text').addClass('hide');
      }
      else if (action == 'maximize') {
        $(this).width('100vw').data('ui-tab-resize-status','maximized').resize();
        $(this).find('.spell-editor').show();
        // $(this).find('.editor-header').show();
        $(this).find('.editor-left').removeClass('tab-border').width(5).height('100%');
        $(this).find('.editor-left-text').addClass('hide');
      }
      else {
        $(this).width(action).removeData('ui-tab-resize-status');
        $(this).find('.spell-editor').show();
        // $(this).find('.editor-header').show();
        $(this).find('.editor-left').removeClass('tab-border').width(5).height('100%');
        $(this).find('.editor-left-text').addClass('hide');
      }
  }
})(jQuery);

var resizeTabs = function(e, ui) {
  if (e.data.dir === 'horizontal') {
    var parentWidth = $(e.data.parent).width();
    var myWidth = $(this).width();
    var myId = '#'+$(this).attr('id');
    var myIdx = e.data.peers.indexOf(myId);
    var leftIds = e.data.peers.filter((el, idx) => idx < myIdx);
    var myLeftId = e.data.peers.filter((el, idx) => idx === myIdx-1);
    var myRightId = e.data.peers.filter((el, idx) => idx === myIdx+1);
    var rightIds = e.data.peers.filter((el, idx) => idx > myIdx);
    var right1Ids = e.data.peers.filter((el, idx) => idx > myIdx+1);
    
    const widthReducer = (acc, cv) => acc + $(cv).width();
    var availWidth = parentWidth - leftIds.reduce(widthReducer,0) - myWidth - right1Ids.reduce(widthReducer,0);

    $(myLeftId[0]).resizable('option','maxWidth', $(myLeftId[0]).width() + myWidth - e.data.minsize);

    if (ui)
      $(this).resizable('option', 'maxWidth', parentWidth - right1Ids.reduce(widthReducer,0) - e.data.minsize);

    // console.log(leftIds,myId, myRightId,rightIds);
    // console.log(parentWidth,leftIds.reduce(widthReducer,0),myWidth,right1Ids.reduce(widthReducer,0), availWidth, parentWidth - right1Ids.reduce(widthReducer,0) - e.data.minsize);
    /*
    if ($(myId).data('ui-tab-resize-status') == 'minimized' && myWidth <= e.data.minsize) {
        console.log('do not move');
      return;
    }
    */
    if ($(myId).data('ui-tab-resize-status') != 'minimized' && myWidth <= e.data.minsize) {
      $(myId).resizeTab('minimize');
      return;
    }
    
    if ($(myId).data('ui-tab-resize-status') == 'minimized' && myWidth > e.data.minsize) {
      $(myId).resizeTab(myWidth);
      //return;
    }
    
    if (availWidth > e.data.minsize) {
        $(myRightId[0]).resizeTab(availWidth);
    }
    else {
        $(myRightId[0]).resizeTab('minimize');
        // $(myRightId[0]).width(e.data.minsize);
        $(this).width((parentWidth - leftIds.reduce(widthReducer,0) - e.data.minsize - Math.max(right1Ids.length*e.data.minsize,right1Ids.reduce(widthReducer,0))));
    }
  }
}