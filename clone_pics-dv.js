$j(function() {
    if (!$j('#attachement').length) return;

    var camWidth = 1280;
    var camHeight = 720;
    var stream = null;
    var capturedBlob = null;
    var brightness = 1, contrast = 1;
    var focusSupported = false, autofocusSupported = false;
    var focusMin = 0, focusMax = 0, focusStep = 0, focusValue = 0;

    // Add modal HTML to the page (once)
    if (!$j('#webcamModal').length) {
        $j('body').append(`
            <div class="modal fade" id="webcamModal" tabindex="-1" role="dialog" aria-labelledby="webcamModalLabel">
              <div class="modal-dialog modal-lg" role="document" style="max-width: 90vw;">
                <div class="modal-content">
                  <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title" id="webcamModalLabel">Capture from Webcam</h4>
                  </div>
                  <div class="modal-body">
                    <div id="webcam-interface" style="text-align:center;">
                        <video id="webcam-video" width="${camWidth}" height="${camHeight}" autoplay style="border: 1px solid #ccc; border-radius: 3px; max-width:100%; height:auto; background:#000;"></video>
                        <div style="margin:10px 0;">
                            <label style="margin-right:10px;">
                                Brightness
                                <input type="range" id="brightness-slider" min="0.5" max="2" step="0.01" value="1" style="vertical-align:middle;">
                            </label>
                            <label>
                                Contrast
                                <input type="range" id="contrast-slider" min="0.5" max="2" step="0.01" value="1" style="vertical-align:middle;">
                            </label>
                        </div>
                        <div style="margin:10px 0;">
                            <label style="margin-right:10px;">
                                <span id="focus-label">Focus</span>
                                <input type="range" id="focus-slider" min="0" max="100" step="1" value="0" style="vertical-align:middle; width:200px;" disabled>
                            </label>
                            <label>
                                <input type="checkbox" id="autofocus-checkbox" style="vertical-align:middle;" disabled>
                                Autofocus
                            </label>
                        </div>
                        <div style="margin-top:10px;">
                            <button type="button" id="capture-btn" class="btn btn-success btn-sm">
                                <i class="glyphicon glyphicon-camera"></i> Capture Photo
                            </button>
                        </div>
                        <div id="captured-preview" style="display: none; margin-top:10px;">
                            <h5>Captured Image:</h5>
                            <canvas id="capture-canvas" width="${camWidth}" height="${camHeight}" style="border: 1px solid #ccc; border-radius: 3px; margin-bottom: 10px; max-width:100%; height:auto;"></canvas>
                            <br>
                            <button type="button" id="use-capture-btn" class="btn btn-primary btn-sm">
                                <i class="glyphicon glyphicon-ok"></i> Use This Photo
                            </button>
                            <button type="button" id="retake-btn" class="btn btn-warning btn-sm">
                                <i class="glyphicon glyphicon-repeat"></i> Retake
                            </button>
                        </div>
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button type="button" id="stop-webcam-btn" class="btn btn-default" data-dismiss="modal">Close</button>
                  </div>
                </div>
              </div>
            </div>
        `);
    }

    // Add the "Capture from Webcam" button immediately after the file input
    if ($j('#start-webcam-btn').length === 0) {
        $j('#attachement').after(`
            <button type="button" id="start-webcam-btn" class="btn btn-info btn-sm" style="margin-left:10px; vertical-align:middle;">
                <i class="glyphicon glyphicon-camera"></i> Capture from Webcam
            </button>
            <input type="hidden" id="webcam-captured-data" name="webcam_captured_data" value="">
        `);
    }

    // Start webcam and show modal
    $j(document).on('click', '#start-webcam-btn', function() {
        $j('#webcamModal').modal('show');
        $j('#captured-preview').hide();
        $j('#capture-btn').show();

        navigator.mediaDevices.getUserMedia({ video: { width: { ideal: camWidth }, height: { ideal: camHeight } } })
            .then(function(mediaStream) {
                stream = mediaStream;
                var video = document.getElementById('webcam-video');
                video.srcObject = stream;
                video.onloadedmetadata = function() {
                    var actualWidth = video.videoWidth;
                    var actualHeight = video.videoHeight;
                    video.width = actualWidth;
                    video.height = actualHeight;
                    var canvas = document.getElementById('capture-canvas');
                    canvas.width = actualWidth;
                    canvas.height = actualHeight;
                };
                updateVideoFilter();
                setupFocusControls();
            })
            .catch(function(err) {
                alert('Error accessing webcam: ' + err.message + '\n\nIf you are not using HTTPS, most browsers will block webcam access. Please use https:// for this feature.');
            });
    });

    // Stop webcam when modal closes
    $j('#webcamModal').on('hidden.bs.modal', function () {
        stopWebcam();
    });

    // Brightness and contrast controls
    $j(document).on('input change', '#brightness-slider', function() {
        brightness = parseFloat(this.value);
        updateVideoFilter();
    });
    $j(document).on('input change', '#contrast-slider', function() {
        contrast = parseFloat(this.value);
        updateVideoFilter();
    });

    function updateVideoFilter() {
        var video = document.getElementById('webcam-video');
        if (video) {
            video.style.filter = `brightness(${brightness}) contrast(${contrast})`;
        }
    }

    // Focus controls
    function setupFocusControls() {
        focusSupported = false;
        autofocusSupported = false;
        var focusSlider = document.getElementById('focus-slider');
        var autofocusCheckbox = document.getElementById('autofocus-checkbox');
        var focusLabel = document.getElementById('focus-label');

        if (!stream) return;
        var videoTrack = stream.getVideoTracks()[0];
        var capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        var settings = videoTrack.getSettings ? videoTrack.getSettings() : {};

        // Check for focus support
        if (capabilities.focusDistance) {
            focusSupported = true;
            focusMin = capabilities.focusDistance.min;
            focusMax = capabilities.focusDistance.max;
            focusStep = capabilities.focusDistance.step || 0.01;
            focusValue = settings.focusDistance || focusMin;

            focusSlider.min = focusMin;
            focusSlider.max = focusMax;
            focusSlider.step = focusStep;
            focusSlider.value = focusValue;
            focusSlider.disabled = false;
            focusLabel.textContent = `Focus (${focusMin}–${focusMax})`;
        } else {
            focusSlider.disabled = true;
            focusLabel.textContent = "Focus (not supported)";
        }

        // Check for autofocus support
        if (capabilities.focusMode && capabilities.focusMode.length > 0) {
            autofocusSupported = true;
            autofocusCheckbox.disabled = false;
            // Set checkbox based on current setting
            if (settings.focusMode && settings.focusMode === "continuous") {
                autofocusCheckbox.checked = true;
            } else {
                autofocusCheckbox.checked = false;
            }
        } else {
            autofocusCheckbox.disabled = true;
        }
    }

    // Handle focus slider change
    $j(document).on('input change', '#focus-slider', function() {
        if (!stream || !focusSupported) return;
        var videoTrack = stream.getVideoTracks()[0];
        var value = parseFloat(this.value);
        videoTrack.applyConstraints({ advanced: [{ focusMode: "manual", focusDistance: value }] });
        $j('#autofocus-checkbox').prop('checked', false);
    });

    // Handle autofocus checkbox
    $j(document).on('change', '#autofocus-checkbox', function() {
        if (!stream || !autofocusSupported) return;
        var videoTrack = stream.getVideoTracks()[0];
        if (this.checked) {
            videoTrack.applyConstraints({ advanced: [{ focusMode: "continuous" }] });
            $j('#focus-slider').prop('disabled', true);
        } else {
            videoTrack.applyConstraints({ advanced: [{ focusMode: "manual" }] });
            $j('#focus-slider').prop('disabled', false);
        }
    });

    // Capture photo
    $j(document).on('click', '#capture-btn', function() {
        var video = document.getElementById('webcam-video');
        var canvas = document.getElementById('capture-canvas');
        var context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.filter = `brightness(${brightness}) contrast(${contrast})`;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

        canvas.toBlob(function(blob) {
            if (blob.size > 5000 * 1024) {
                alert('Captured image is too large. Please try again with better lighting or closer to the camera.');
                return;
            }
            capturedBlob = blob;
            $j('#captured-preview').show();
            $j('#capture-btn').hide();
        }, 'image/jpeg', 1.0);
    });

    // Retake photo
    $j(document).on('click', '#retake-btn', function() {
        $j('#captured-preview').hide();
        $j('#capture-btn').show();
        capturedBlob = null;
        $j('#webcam-captured-data').val('');
    });

    // Use captured photo
    $j(document).on('click', '#use-capture-btn', function() {
        if (!capturedBlob) return;
        var reader = new FileReader();
        reader.onload = function() {
            $j('#webcam-captured-data').val(reader.result);
            $j('#attachement').val('');
            alert('Photo captured! Remember to save the record to store the image.');
            $j('#webcamModal').modal('hide');
        };
        reader.readAsDataURL(capturedBlob);
    });

    function stopWebcam() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        $j('#captured-preview').hide();
        $j('#capture-btn').show();
    }

    $j(window).on('beforeunload', function() {
        stopWebcam();
    });
});