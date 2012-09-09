$(function() {
    function _process_error(data, employee) {
        var callback = null;
        var deadline = $("#deadline").html();
        if (data.ret == -11) { // duplicate booking
            callback = function() {
                window.location = "#booked-header";
            }

        } else if (data.ret == -12) { // Cancelling later than deadline
            $modal.data("employee", employee);
            _show_modal(sprintf("Orders can't be canceled after deadline(%s). \
However, we can mark your order as <b>discarded</b> so anyone who hasn't booked can claim it. \
Of course, We can't promise your order will be claimed. Click following button to discard your order: \
<button class='btn btn-inverse btn-mini discard-btn'>Discard</button>", deadline),
                        "Can't cancel order after " + deadline);
            return;
        } else if (data.ret == -10) {
            _show_modal(sprintf("Orders can't be placed after deadline(%s). \
However, you can claim <a href='#discarded-header' onclick='$(\"#modal-dismiss\").click();'>discarded orders</a> if there's any.", deadline),
                        "Can't order after " + deadline);
            return;
        }

        _show_modal(sprintf("We failed to process your request. You can contact the receptionists for help. Error detail:<br /><br/><i>%s<i>", data.error),
                    "Failed to process your request, sorry", callback);
    }

    function _show_modal(content, title, callback, button_title) {
        if (title === undefined) {
            title = "Hands up! There's something I want you to know";
        }

        if (button_title) {
            $("#modal-dismiss").html(button_title);
        } else {
            $("#modal-dismiss").html("Dismiss");
        }

        $("#modal-title").html(title);
        $("#modal-body").html(content);
        $("#modal-dismiss").unbind('click');

        if (typeof callback == "function") {
            $("#modal-dismiss").bind('click', callback);
        }

        $modal.modal();
    }

    function _book_ajax(event) {
        event.preventDefault();
        event.stopPropagation();

        var employee = $(this).data('employee');
        var $anchor = $(this);
        $.ajax('api.php?method=add-booking', {
            type: 'GET',
            dataType: 'json',
            data: {
                employee: employee,
            },
            success: function(data) {
                if (data.ret == 0) {
                    _populate_user($booked_container, $("#booked-btn-templated"), employee);
                    $anchor.closest("div.btn-group").remove();
                    $("#booked-count").html(parseInt($("#booked-count").html()) + 1);
                    $("#unbooked-count").html(parseInt($("#unbooked-count").html()) - 1);

                    _show_modal("Your booking is successful.", "Congratulations!", function() {
                        window.location = "#booked-header";
                    });

                } else {
                    _process_error(data, employee);
                }
                $('body').click();
            },
            error: function(jqXHR, status, err) {
                console.log("add booking ajax failed: " + err);
                $('body').click();
            },
        });
    }

    function _unbook_ajax(event) {
        event.preventDefault();
        event.stopPropagation();

        var employee = $(this).data('employee');
        var $anchor = $(this);
        $.ajax('api.php?method=remove-booking', {
            type: 'GET',
            dataType: 'json',
            data: {
                employee: employee,
            },
            success: function(data) {
                if (data.ret == 0) {
                    _populate_user($unbooked_container, $("#unbooked-btn-templated"), employee);
                    $anchor.closest("div.btn-group").remove();
                    $("#booked-count").html(parseInt($("#booked-count").html()) - 1);
                    $("#unbooked-count").html(parseInt($("#unbooked-count").html()) + 1);
                    _show_modal("Your booking is canceled successfully.", "Order Canceled", function() {
                        window.location = "#booked-header";
                    });

                } else {
                    $modal.data('anchor', $anchor);
                    _process_error(data, employee);
                }
                $('body').click();
            },
            error: function(jqXHR, status, err) {
                console.log("canceling order ajax failed: " + err);
                $('body').click();
            },
        });
    }

    function _discard_ajax(event) {
        event.preventDefault();
        event.stopPropagation();

        var employee = $modal.data('employee');
        var $anchor = $modal.data('anchor');
        $.ajax('api.php?method=discard-booking', {
            type: 'GET',
            dataType: 'json',
            data: {
                employee: employee,
            },
            success: function(data) {
                if (data.ret == 0) {
                    _populate_user($discarded_container, $("#discarded-btn-templated"), employee);
                    $anchor.closest("div.btn-group").remove();
                    $("#booked-count").html(parseInt($("#booked-count").html()) - 1);
                    $("#discarded-count").html(parseInt($("#discarded-count").html()) + 1);

                    $("#modal-body").html("Your booking is marked as 'discarded'. \
Anyone want to have dinner but forgot to order in time can claim yours.",
                                          "Order Waiting For Transfer");
                    $("#modal-title").html("Your order is waiting for transfer");
                    $("#modal-dismiss").html("Dismiss");

                    $("#modal-dismiss").unbind('click');
                    $("#modal-dismiss").bind('click', function() {
                        window.location = "#discarded-header";
                    });

                } else {
                    _process_error(data, employee);
                }
                $('body').click();
            },
            error: function(jqXHR, status, err) {
                console.log("discarding ajax failed: " + err);
                $('body').click();
            },
        });
    }

    function _claim_ajax(event) {
        var new_owner = $("#claim-owner-input").val();
        var old_owner = $modal.data("original-employee");
        var $anchor = $modal.data("anchor");
        //console.log(sprintf("will claim from %s to %s", old_owner, new_owner));

        $.ajax('api.php?method=claim-discarded', {
            type: 'GET',
            dataType: 'json',
            data: {
                new_owner: new_owner,
                old_owner: old_owner,
            },
            success: function(data) {
                if (data.ret == 0) {
                    _populate_user($booked_container, $("#booked-btn-templated"), new_owner);
                    $anchor.closest("div.btn-group").remove();
                    $("#booked-count").html(parseInt($("#booked-count").html()) - 1);
                    $("#discarded-count").html(parseInt($("#discarded-count").html()) + 1);

                    $("#modal-body").html("You have successfully claimed order from " + old_owner + ". Hope you enjoy your dinner tonight.");
                    $("#modal-dismiss").html("Dissmiss");

                    $("#modal-dismiss").unbind('click');
                    $("#modal-dismiss").bind('click', function() {
                        window.location = "#booked-header";
                    });

                } else {
                    _process_error(data);
                }
            },
            error: function(jqXHR, status, err) {
                console.log("claim ajax failed: " + err);
                $('body').click();
            },
        });
    }

    function _create_claim_input() {
        $(".typeahead").remove();
        $.ajax('api.php?method=claim-candidates', {
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                (function fill_input() {
                    var $input = $("#claim-owner-input");
                    if ($input.length == 0) {
                        setTimeout(fill_input, 500);
                        return;
                    }
                    $input.typeahead({source: data});
                })();
            },
            error: function(jqXHR, status, err) {
                console.log("discarding ajax failed: " + err);
                $('body').click();
            }
        });

        return "<input id='claim-owner-input' type='text' data-provide='typeahead' style='margin-left: 10px;'/>";
    }
    
    function _show_claim_modal(event) {
        event.preventDefault();
        event.stopPropagation();

        var original_owner = $(this).data('employee');
        $modal.data('original-employee', original_owner);
        $modal.data('anchor', $(this));

        _show_modal("Please provide your name:" + _create_claim_input(), "Claiming Discarded Order",
                    function(event) {
                        _claim_ajax();
                        return false;
                    },
                   "Claim");
    }

    function _populate_user($container, $template, name) {
        var $btn = $template.clone().removeClass('hide').removeAttr('id');
        $("button.name-pill", $btn).html(name);
        $("a.book-anchor, a.unbook-anchor, a.claim-anchor", $btn).data('employee', name);
        $container.append($btn);
    }

    // Populate free employees
    var categories = ["booked", "unbooked", "discarded"];
    for (idx in categories) {
        var category = categories[idx];
        var $container = $(sprintf("#%s-btn-container", category));
        $(sprintf("span.%s-btn-merit", category)).each(function(idx, item) {
            var name = $(item).html();
            _populate_user($container, $(sprintf("#%s-btn-templated", category)), name);
            $(item).remove();
        });
    }

    var $unbooked_container = $("#unbooked-btn-container");
    var $booked_container = $("#booked-btn-container");
    var $discarded_container = $("#discarded-btn-container");
    var $modal = $("#modal-div");

    $("input.searchbox").keyup(function(event) {
        var query = $(this).val().toLowerCase().trim();
        $(this).closest('.page-header').next().find("button.name-pill").each(function(idx, item) {
            var cur_name = $(item).html().toLowerCase().trim();
            if (cur_name.indexOf(query) == -1) {
                $(item).parent().hide();
            } else {
                $(item).parent().show();
            }
        });
    });

    $("#unbooked-btn-container").on("click", "a.book-anchor", _book_ajax);
    $("#booked-btn-container").on("click", "a.unbook-anchor", _unbook_ajax);
    $("#discarded-btn-container").on("click", "a.claim-anchor", _show_claim_modal);
    $modal.on("click", "button.discard-btn", _discard_ajax);
    // Clicking the name pill button triger the first button in the corresponding dropdown list.
    $("button.name-pill").click(function() {
        $(this).closest("div.name-btn").find('a').first().click();
    });

    $("#loading-modal").ajaxStart(function() {
        $("#loading-modal").fadeIn();
    });
    $("#loading-modal").ajaxStop(function() {
        $("#loading-modal").fadeOut();
    });
});