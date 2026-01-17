import api from '../api';

export const duplicateBatch = async (id: string) => {
    const response = await api.post(`/batches/${id}/duplicate`);
    return response.data;
};
