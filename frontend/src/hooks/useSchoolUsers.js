import { useState, useCallback } from 'react';
import { api } from '../utils/api';

export function useSchoolUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/school/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors du chargement des utilisateurs");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/school/users', userData);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création");
      await fetchUsers(); // Refresh list
      return { success: true, data };
    } catch (err) {
      console.error(err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id, userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/api/school/users/${id}`, userData);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la modification");
      await fetchUsers(); // Refresh list
      return { success: true, data };
    } catch (err) {
      console.error(err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.delete(`/api/school/users/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }
      await fetchUsers(); // Refresh list
      return { success: true };
    } catch (err) {
      console.error(err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const archiveUser = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/api/school/users/${id}/archive`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'archivage");
      }
      await fetchUsers(); // Refresh list
      return { success: true };
    } catch (err) {
      console.error(err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    archiveUser
  };
}
