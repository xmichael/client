'use strict';

define(function(require) {
    var config = require('config');
    var map = require('map');

    $('#navbar-side').addClass('reveal');
    $('#navbar-open-btn').on('click', function() {
        $('#navbar-side').addClass('reveal');
    });

    $('#navbar-close-btn').on('click', function() {
        $('#navbar-side').removeClass('reveal');
    });

    $('input[name="map-select"]').on('click', function(e) {
        map.setSelectType($(e.target).val());
        $('#draw-details').hide();
        map.clearMap();
    });

    $(document).on(map.EVT_DELETE_LINE, function() {
        $('#draw-details').hide();
    });

    $(document).on(map.EVT_LINE_ADDED, function(e, line) {
        $('#draw-details').show();
        $('#create-image-btn').text('Create NDVI Transect');
    });

    $(document).on(map.EVT_RECT_ADDED, function(e) {
        $('#draw-details').show();
        $('#create-image-btn').text('Create NDVI Time Series');
    });

    $(document).on(map.EVT_MAP_CLICK, function(e, point) {
        $('#available-tiles').empty();
        $.getJSON(config.backend_url + '/landsat', {
            lon: point.lon, lat: point.lat
        }).done(function(data) {
            // TODO: just showing first 10
            $.each(data.msg.slice(0, 10), function(i, entry) {
                var index = entry.download_url;
                var imagePath = index.substr(0, index.lastIndexOf('/'));
                var productId = index.split('/')[8];
                var sThumb = imagePath + '/' + productId + '_thumb_small.jpg';
                var lThumb = imagePath + '/' + productId + '_thumb_large.jpg';

                $('#available-tiles').append(`
                      <div class="thumb loader"
                         data-field-id="${entry.entityId}"
                         data-field-large-thumb="${lThumb}"
                         data-field-e="${entry.max_lon}"
                         data-field-w="${entry.min_lon}"
                         data-field-n="${entry.max_lat}"
                         data-field-s="${entry.min_lat}">
                      <img src="${sThumb}"></img>

                    <div class="thumb-meta">
                      <div title="Show/Hide image metadata"
                         class="thumb-meta-more">more</div>
                      <table class="table">
                        <tbody>
                          <tr>
                            <th>Acquisition Date</th>
                            <th>${entry.acquisitionDate}</th>
                          </tr>
                          <tr class="collapsible">
                            <th>Cloud Cover</th>
                            <th>${entry.cloudCover}</th>
                          </tr>
                          <tr class="collapsible">
                            <th>Entity ID</th>
                            <th>${entry.entityId}</th>
                          </tr>
                          <tr class="collapsible">
                            <th>Epoch</th>
                            <th>${entry.epoch}</th>
                          </tr>
                          <tr class="collapsible">
                            <th>Minimum Latitude</th>
                            <th>${entry.min_lat}</th>
                          </tr>
                          <tr class="collapsible">
                            <th>Minimum Longitude</th>
                            <th>${entry.min_lon}</th>
                          </tr>
                          <tr class="collapsible">
                            <th>Maximum Latitude</th>
                            <th>${entry.max_lat}</th>
                          </tr>
                          <tr class="collapsible">
                            <th>Maximum Longitude</th>
                            <th>${entry.max_lon}</th>
                          </tr>
                          <tr class="collapsible">
                            <th>Processing Level</th>
                            <th>${entry.processingLevel}</th>
                          </tr>
                          <tr class="collapsible">
                            <th>Product ID</th>
                            <th>${entry.productId}</th>
                          </tr>
                          <tr class="collapsible">
                            <th>Path</th>
                            <th>${entry.path}</th>
                          </tr>
                          <tr class="collapsible">
                            <th>Row</th>
                            <th>${entry.row}</th>
                          </tr>
                        </tbody>
                      </table>
                    </div>`
                );
            });
        });
    });

    $(document).on('click', '.thumb img', function() {
        var div = $(this).parent();
        if(div.hasClass('selected')){
            // delete overlay using entity id
            map.removeOverlay(div.attr('data-field-id'));
            div.removeClass('selected');
        }
        else{
            div.addClass('selected');
            map.displayOverlay(
                div.attr('data-field-id'),
                div.attr('data-field-large-thumb'),
                {
                    west: div.attr('data-field-w'),
                    south: div.attr('data-field-s'),
                    east: div.attr('data-field-e'),
                    north: div.attr('data-field-n')
                }
            );
        }
    });

    $(document).on('click', '.thumb-meta-more', function(e) {
        if ($(this).text() === 'more') {
            $(this).siblings().find('.collapsible').show();
            $(this).text('less');
        }
        else {
            $(this).siblings().find('.collapsible').hide();
            $(this).text('more');
        }
    });

    $('#draw-details-delete').on('click', function() {
        map.clearMap();
        $('#draw-details').hide();
    });


    $('#create-image-btn').on('click', function() {
        var selection = 'line';
        var type = 'ndvi_transect';
        var extents;

        if($('#draw-line-chk:checked').length === 1){
            console.log(map.getTransectExtents());
            extents = map.getTransectExtents();
        }
        else if($('#draw-rect-chk:checked').length === 1){
            selection = 'rectangle';
            type = 'ndvi_time_series';
            console.log(map.getTimeSeriesExtents());
            extents = map.getTimeSeriesExtents();
        }

        var url = config.backend_url + '/datacube?selection=' + selection +
            '&type=' + type +
            '&xmin=' + extents.xmin +
            '&xmax=' + extents.xmax +
            '&ymin=' + extents.ymin +
            '&ymax=' + extents.ymax;
        $("#view-image").attr('src', url);
        $('#view-image-popup').modal({})
    });
});
