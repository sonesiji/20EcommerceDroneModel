import cv2
import numpy as np
import asyncio
import websockets
import json

async def gesture_server(websocket, path):
    cap = cv2.VideoCapture(0)  # Capture from the webcam

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Detect hand gestures
        gesture_data = detect_hand_gesture(frame)
        
        # Send gesture data to the WebSocket
        await websocket.send(json.dumps(gesture_data))

        # Display the frame
        cv2.imshow('Gesture Recognition', frame)

        # Exit on 'q' key
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

def detect_hand_gesture(frame):
    # Convert the frame to HSV color space
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Define the range for skin color (this may need adjustment)
    lower_skin = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin = np.array([20, 255, 255], dtype=np.uint8)

    # Create a mask for skin color
    mask = cv2.inRange(hsv, lower_skin, upper_skin)

    # Find contours in the mask
    contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    if contours:
        # Get the largest contour
        largest_contour = max(contours, key=cv2.contourArea)
        # Draw the contour on the frame
        cv2.drawContours(frame, [largest_contour], -1, (0, 255, 0), 3)

        # Here you can add logic to detect specific gestures based on contour shape
        # For simplicity, we'll just return a dummy gesture
        return {"gesture": "wave"}  # Example gesture data

    return {"gesture": "none"}

start_server = websockets.serve(gesture_server, "localhost", 8000)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()