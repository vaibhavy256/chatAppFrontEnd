import React, { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { FaFileUpload } from "react-icons/fa";
import useChatContext from "../context/ChatContext"
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import toast from "react-hot-toast";
import {baseURL} from "../config/AxiosHelper"
import { useNavigate } from "react-router";
import { getMessagesApi} from "../services/RoomService";
import { timeAgo } from "../config/helper";

const ChatPage = () => {
    const{roomId, currentUser,connected,setConnected,
      setRoomId,
      setCurrentUser,}=useChatContext();
    const navigate = useNavigate();
    useEffect(()=>{
      if(!connected){
        navigate("/"); 
      }
    },[connected, roomId,currentUser]);
    const [messages, setMessages]=useState([]);
    const [input,setInput]=useState("");
    const inputRef=useRef(null)
    const chatBoxRef=useRef(null)
    const [stompClient, setStompClient]=useState(null);
    //page init
    //need to load the messages 
    useEffect(()=>{
     async function loadMessages(){
      try {
        const messages = await getMessagesApi(roomId);
        // Ensure fetchedMessages is an array before setting it
        if (Array.isArray(messages)) {
          setMessages(messages);
        } else {
          console.warn("Fetched data is not an array:", messages);
          setMessages([]); // Default to an empty array if not an array
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
     }
     if(connected){
      loadMessages();
     }
    },[roomId,connected])

    //scroll down
    useEffect(()=>{
      if(chatBoxRef.current){
        chatBoxRef.current.scroll({
          top:chatBoxRef.current.scrollHeight,
          behavior:"smooth",
        })
      }
    },[messages]);

    //need to init the stompclient 
    //subscribe
    useEffect(()=> {
      const connectWebSocket= ()=>{
        const sock=new SockJS(`${baseURL}/chat`);
        const client=Stomp.over(sock);
        client.connect({},()=>{
          setStompClient(client);
          toast.success("connected");

          client.subscribe(`/topic/room/${roomId}`, (message) => {
            try {
              const newMessage = JSON.parse(message.body); // Parse message body
              setMessages((prev) => [...prev, newMessage]); // Update messages state
            } catch (error) {
              console.error("Failed to parse message:", error);
            }
          });
        }, (error) => {
          toast.error("Failed to connect to WebSocket");
          console.error("WebSocket connection error:", error);
        });
      };
      if (connected) {
        connectWebSocket();
      }
    },[roomId,connected]);


    //send message handle
    const sendMessage=async ()=>{
      //when you are connected and stompClient is there 
      if(stompClient && connected && input.trim()){
        console.log(input)
        const message={
          sender:currentUser,
          content:input,
          roomId:roomId,
        };
        console.log(roomId);
        stompClient.send(`/app/sendMessage/${roomId}`,{},JSON.stringify(message),{});

        setInput("");
      }
    };

    function handleLogout(){
      stompClient.disconnect();
      setConnected(false);
      setCurrentUser("")
      setRoomId("")
      navigate("/")
    }
    const avatarServices = [
      "https://avatars.dicebear.com/api/avataars/",
      "https://robohash.org/",
      "https://api.multiavatar.com/",
    ];
    
    const getConsistentAvatar = (username) => {
      // Generate a consistent index based on the username
      const index = username.charCodeAt(0) % avatarServices.length;
      const selectedService = avatarServices[index];
      return `${selectedService}${encodeURIComponent(username)}.png`;
    };
    

  return (
  <div className=" ">
    <header className="dark:border-gray-700 h-20 fixed w-full dark:bg-gray-800 py-5 shdow flex justify-around items-center">
        {/*room name */}
    <div>
        <h1 className="text-xl font-semibold">  
            Room: <span>{roomId}</span>
        </h1>
    </div>
    {/*username container*/}
    <div>
        <h1 className="text-xl font-semibold">  
            User : <span>{currentUser}</span>
        </h1>
    </div>
    {/*button: leave room */}
    <div>
        <button onClick={handleLogout} className="dark:bg-red-500 dark:hover:bg-red-600 px-3 py-2 rounded-full">
            Leave Room
        </button>
    </div>
    </header>
    <main 
      ref={chatBoxRef}
      className="py-20 px-10   w-2/3 dark:bg-slate-600 mx-auto h-screen overflow-auto ">
        {messages.map((message,index)=>(
            <div
            key={index}
            className={`flex ${
              message.sender === currentUser ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`my-2 ${
                message.sender === currentUser ? "bg-orange-700" : "bg-violet-900"
              } p-2 max-w-xs rounded`}
            >
              <div className="flex flex-row gap-2">
                <img
                  className="h-10 w-10"
                  img src={getConsistentAvatar(currentUser)}
                  alt=""
                />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold">{message.sender}</p>
                  <p>{message.content}</p>
                  <p className="text-xs text-gray-400">
                    {timeAgo(message.timeStamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
            ))}
    </main>
    

    {/* Input message container*/}
    <div className="fixed bottom-4 w-full h-16 ">
        <div className="h-full  pr-10 gap-4 flex items-center justify-between rounded-full w-1/2 mx-auto dark:bg-gray-800">
        <input
            value={input}
            onChange={(e)=>{
              setInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            type="text"
            placeholder="Type your message here..."
            className=" w-full  dark:border-gray-600 b dark:bg-gray-800  px-5 py-2 rounded-full h-full focus:outline-none  "
          />
           <button className="dark:bg-purple-600 h-10 w-10  flex   justify-center items-center rounded-full">
                <FaFileUpload size={20}/>
           </button>
           <button onClick={sendMessage} className="dark:bg-orange-500 h-10 w-10  flex justify-center items-center rounded-full">
                <IoSend size={20} />
           </button>
        </div>  
    </div>
    </div>
  );
};

export default ChatPage