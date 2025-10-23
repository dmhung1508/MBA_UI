import chainlit as cl
import requests,json
def upload(file_path,name):
    # URL của API
    url = 'https://sculpin-winning-feline.ngrok-free.app/uploadfile/'

    # Mở file và đọc nội dung
    with open(file_path, 'r') as file:
        file_content = file.read()

    # Tạo yêu cầu POST
    files = {'file': (name, file_content, 'application/json')}
    response = requests.post(url, files=files)

    # In ra kết quả
    print(response.json())
@cl.on_chat_start
async def start():
    files = None

    # Wait for the user to upload a file
    while files == None:
        files = await cl.AskFileMessage(
            content="Please upload a text file to begin!", accept={"text/plain": [".pdf", ".docs",".json"]},max_size_mb = 20,max_files = 10, timeout= 180

        ).send()
    for text_file in files:
        upload(text_file.path,text_file.name)  
        await cl.Message(
            content=f"{text_file.name}` uploaded!"
    ).send()

