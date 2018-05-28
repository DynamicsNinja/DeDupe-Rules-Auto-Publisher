onlineIcon = "../img/online.png";
offlineIcon = "../img/offline.png";
online = false;
stepId = "e049ab1e-aa62-e811-8123-5065f38a9a41";
configId = "";
var VERSION = parent.Xrm.Page.context.getVersion() != undefined ? parent.Xrm.Page.context.getVersion().substring(0, 3) : "8.0";

toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": false,
    "progressBar": false,
    "positionClass": "toast-bottom-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
}

function enablePluginStep() {
    var entity = {};

    if (online == false) {
        entity.statecode = 0;
        entity.statuscode = 1;
    } else {
        entity.statecode = 1;
        entity.statuscode = 2;
    }

    $.ajax({
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: Xrm.Page.context.getClientUrl() + "/api/data/v" + VERSION + "/sdkmessageprocessingsteps(" + stepId + ")",
        data: JSON.stringify(entity),
        beforeSend: function (XMLHttpRequest) {
            XMLHttpRequest.setRequestHeader("OData-MaxVersion", "4.0");
            XMLHttpRequest.setRequestHeader("OData-Version", "4.0");
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        async: true,
        success: function (data, textStatus, xhr) {
            //Success - No Return Data - Do Something
            if (online == false) {
                $("#status-icon img").attr("src", onlineIcon);
                $("#status-text").text("ACTIVATED");
                toastr["success"]("DeDupe is successfuly enabled!");
                online = true;
            } else {
                $("#status-icon img").attr("src", offlineIcon);
                $("#status-text").text("DEACTIVATED");
                toastr["success"]("DeDupe is successfuly disabled!");
                online = false;
            }
        },
        error: function (xhr, textStatus, errorThrown) {
            toastr["error"]("Error while enabling/disabling DeDupe plugin!");
        }
    });
}

function getStepState() {
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: Xrm.Page.context.getClientUrl() + "/api/data/v" + VERSION + "/sdkmessageprocessingsteps(" + stepId + ")?$select=statecode,statuscode",
        beforeSend: function (XMLHttpRequest) {
            XMLHttpRequest.setRequestHeader("OData-MaxVersion", "4.0");
            XMLHttpRequest.setRequestHeader("OData-Version", "4.0");
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        async: true,
        success: function (data, textStatus, xhr) {
            var result = data;
            var statecode = result["statecode"];
            var statuscode = result["statuscode"];

            if (statecode == 0) {
                $("#status-icon img").attr("src", onlineIcon);
                $("#status-text").text("ACTIVATED");
                online = true;
            } else {
                $("#status-icon img").attr("src", offlineIcon);
                $("#status-text").text("DEACTIVATED");
                online = false;
            }
        },
        error: function (xhr, textStatus, errorThrown) {
            toastr["error"]("Error while fetching DeDupe plugin status!");
        }
    });
}

function populateRuleTable() {
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: Xrm.Page.context.getClientUrl() + "/api/data/v" + VERSION + "/duplicaterules?$select=name,statecode",
        beforeSend: function (XMLHttpRequest) {
            XMLHttpRequest.setRequestHeader("OData-MaxVersion", "4.0");
            XMLHttpRequest.setRequestHeader("OData-Version", "4.0");
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
            XMLHttpRequest.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
        },
        async: true,
        success: function (data, textStatus, xhr) {
            var results = data;
            $("tbody").empty();
            for (var i = 0; i < results.value.length; i++) {
                var name = results.value[i]["name"];
                var ruleid = results.value[i]["duplicateruleid"];
                var statecode = results.value[i]["statecode"];
                var statecode_formatted = results.value[i]["statecode@OData.Community.Display.V1.FormattedValue"];

                var row = "<tr>"
                    + "<td id='job-label-" + ruleid + "'>" + name + "</td>"
                    + "<td class='td-center'><img class='rule-status-icon' src='" + (statecode == 1 ? onlineIcon : offlineIcon) + "'></img></td>"
                    + "<td class='td-center'><input id='role-republish-" + ruleid + "' type='checkbox' onchange='enableSave()'></td>"
                    + "</tr>";

                $("tbody").append(row);
            }
            getConfiguration();
        },
        error: function (xhr, textStatus, errorThrown) {
            toastr["error"]("Error while fetching deduplication rules!");
        }
    });
}

function saveConfig() {
    if ($("#btn-save-config").hasClass('disabled')) { return; }

    var ids = [];
    $("input:checked").each(function () { ids.push(this.id.slice(-36)); });

    var entity = {};
    entity.fic_jobids = ids.join();

    $.ajax({
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: Xrm.Page.context.getClientUrl() + "/api/data/v" + VERSION + "/fic_dedupeconfigurations(" + configId + ")",
        data: JSON.stringify(entity),
        beforeSend: function (XMLHttpRequest) {
            XMLHttpRequest.setRequestHeader("OData-MaxVersion", "4.0");
            XMLHttpRequest.setRequestHeader("OData-Version", "4.0");
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        async: true,
        success: function (data, textStatus, xhr) {
            disableSave();
            toastr["success"]("DeDupe configuration is successfuly saved!");
        },
        error: function (xhr, textStatus, errorThrown) {
            toastr["error"]("Error while saving DeDupe configuration!");
        }
    });
}

function getConfiguration() {
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: Xrm.Page.context.getClientUrl() + "/api/data/v" + VERSION + "/fic_dedupeconfigurations",
        beforeSend: function (XMLHttpRequest) {
            XMLHttpRequest.setRequestHeader("OData-MaxVersion", "4.0");
            XMLHttpRequest.setRequestHeader("OData-Version", "4.0");
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
            XMLHttpRequest.setRequestHeader("Prefer", "odata.maxpagesize=1");
        },
        async: true,
        success: function (data, textStatus, xhr) {
            var results = data.value;
            if (results.length == 0) {
                createConfiguration();
                return;
            }
            configId = results[0]["fic_dedupeconfigurationid"];
            var jobIds = results[0]["fic_jobids"].split(",");

            $.each(jobIds, function (index, value) {
                $('#role-republish-' + value).prop('checked', true);
            });

            toastr["success"]("DeDupe configuration is found!");
        },
        error: function (xhr, textStatus, errorThrown) {
            if (xhr.status == 403) {
                $(':checkbox').prop("disabled", true);
                toastr["error"]("You don't have privilege to change configuration!");
            } else {
                toastr["error"]("Error while fetching DeDupe configuration!");
            }
        }
    });
}

function createConfiguration() {
    var entity = {};
    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: Xrm.Page.context.getClientUrl() + "/api/data/v" + VERSION + "/fic_dedupeconfigurations",
        data: JSON.stringify(entity),
        beforeSend: function (XMLHttpRequest) {
            XMLHttpRequest.setRequestHeader("OData-MaxVersion", "4.0");
            XMLHttpRequest.setRequestHeader("OData-Version", "4.0");
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        async: true,
        success: function (data, textStatus, xhr) {
            var uri = xhr.getResponseHeader("OData-EntityId");
            var regExp = /\(([^)]+)\)/;
            var matches = regExp.exec(uri);
            configId = matches[1];
            toastr["success"]("New DeDupe configuration is created!");
        },
        error: function (xhr, textStatus, errorThrown) {
            toastr["error"]("Error while creating new DeDupe configuration!");
        }
    });
}

function disableSave() {
    $("#btn-save-config").addClass('disabled');
}

function enableSave() {
    $("#btn-save-config").removeClass('disabled');
}

function initialize() {
    getStepState();
    populateRuleTable();
}

initialize();