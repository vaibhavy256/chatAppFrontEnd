import {httpClient} from "../config/AxiosHelper"

export const createRoomAPi = async (roomId, userName) => {
    const response = await httpClient.post(`/api/create/${roomId}/${userName}`);
    return response.data;
};

export const joinRoomApi=async(roomId,userName) => {
    const response =await httpClient.post(`/api/join/${roomId}/${userName}`);
    return response.data;
}

export const getMessagesApi=async(roomId) =>{
    const response=await httpClient.get(`/api/messages/${roomId}`);
    return response.data;
}

