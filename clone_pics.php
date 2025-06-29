<?php
	// For help on using hooks, please refer to https://bigprof.com/appgini/help/working-with-generated-web-database-application/hooks

	function clone_pics_init(&$options, $memberInfo, &$args) {
		// Create temp directory if it doesn't exist
		$tempDir = dirname(__FILE__) . '/../images/tmp';
		if (!is_dir($tempDir)) {
			mkdir($tempDir, 0755, true);
		}
		
		return TRUE;
	}

	function clone_pics_header($contentType, $memberInfo, &$args) {
		$header='';

		switch($contentType) {
			case 'tableview':
				$header='';
				break;

			case 'detailview':
				$header='';
				break;

			case 'tableview+detailview':
				$header='';
				break;

			case 'print-tableview':
				$header='';
				break;

			case 'print-detailview':
				$header='';
				break;

			case 'filters':
				$header='';
				break;
		}

		return $header;
	}

	function clone_pics_footer($contentType, $memberInfo, &$args) {
		$footer='';

		switch($contentType) {
			case 'tableview':
				$footer='';
				break;

			case 'detailview':
				$footer='';
				break;

			case 'tableview+detailview':
				$footer='';
				break;

			case 'print-tableview':
				$footer='';
				break;

			case 'print-detailview':
				$footer='';
				break;

			case 'filters':
				$footer='';
				break;
		}

		return $footer;
	}

	function clone_pics_before_insert(&$data, $memberInfo, &$args) {
		// Handle webcam captured image
		if (!empty($_POST['webcam_captured_data'])) {
			$result = handleWebcamCapture($_POST['webcam_captured_data']);
			if ($result['success']) {
				$data['attachement'] = $result['filename'];
			} else {
				// Set error and prevent insert
				$args['error_message'] = $result['error'];
				return FALSE;
			}
		}
		
		return TRUE;
	}

	function clone_pics_after_insert($data, $memberInfo, &$args) {
		return TRUE;
	}

	function clone_pics_before_update(&$data, $memberInfo, &$args) {
		// Handle webcam captured image
		if (!empty($_POST['webcam_captured_data'])) {
			$result = handleWebcamCapture($_POST['webcam_captured_data']);
			if ($result['success']) {
				$data['attachement'] = $result['filename'];
			} else {
				// Set error and prevent update
				$args['error_message'] = $result['error'];
				return FALSE;
			}
		}
		
		return TRUE;
	}

	function clone_pics_after_update($data, $memberInfo, &$args) {
		return TRUE;
	}

	function clone_pics_before_delete($selectedID, &$skipChecks, $memberInfo, &$args) {
		return TRUE;
	}

	function clone_pics_after_delete($selectedID, $memberInfo, &$args) {
	}

	function clone_pics_dv($selectedID, $memberInfo, &$html, &$args) {
	}

	function clone_pics_csv($query, $memberInfo, &$args) {
		return $query;
	}
	
	function clone_pics_batch_actions(&$args) {
		return [];
	}

	// Custom function to handle webcam capture
	function handleWebcamCapture($base64Data) {
		try {
			// Validate base64 data
			if (strpos($base64Data, 'data:image/') !== 0) {
				return ['success' => false, 'error' => 'Invalid image data'];
			}
			
			// Extract image data
			$imageData = explode(',', $base64Data);
			if (count($imageData) != 2) {
				return ['success' => false, 'error' => 'Invalid image format'];
			}
			
			$imageType = $imageData[0];
			$imageContent = base64_decode($imageData[1]);
			
			if ($imageContent === false) {
				return ['success' => false, 'error' => 'Failed to decode image'];
			}
			
			// Validate file size (5MB limit)
			if (strlen($imageContent) > 5000 * 1024) {
				return ['success' => false, 'error' => 'Image too large (max 5MB)'];
			}
			
			// Determine file extension
			$extension = 'jpg'; // Default
			if (strpos($imageType, 'image/png') !== false) {
				$extension = 'png';
			} elseif (strpos($imageType, 'image/gif') !== false) {
				$extension = 'gif';
			} elseif (strpos($imageType, 'image/webp') !== false) {
				$extension = 'webp';
			}
			
			// Generate unique filename (similar to AppGini's method)
			$filename = 'webcam_' . date('Y-m-d_H-i-s') . '_' . uniqid() . '.' . $extension;
			
			// Save to images directory
			$imagePath = dirname(__FILE__) . '/../images/' . $filename;
			
			if (file_put_contents($imagePath, $imageContent) === false) {
				return ['success' => false, 'error' => 'Failed to save image'];
			}
			
			// Validate image
			$imageInfo = getimagesize($imagePath);
			if ($imageInfo === false) {
				unlink($imagePath); // Delete invalid file
				return ['success' => false, 'error' => 'Invalid image file'];
			}
			
			// Check if it's an allowed image type
			$allowedTypes = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP];
			if (!in_array($imageInfo[2], $allowedTypes)) {
				unlink($imagePath); // Delete invalid file
				return ['success' => false, 'error' => 'Image type not allowed'];
			}
			
			return ['success' => true, 'filename' => $filename];
			
		} catch (Exception $e) {
			return ['success' => false, 'error' => 'Error processing image: ' . $e->getMessage()];
		}
	}
?>