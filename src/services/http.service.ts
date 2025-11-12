import { authService } from './auth.service'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.devcorebits.com'

class HttpService {
  
  /**
   * Obtener headers con autorización
   */
  private async getHeaders(): Promise<HeadersInit> {
    const token = await authService.getAccessTokenAsync()
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    try {
      const headers = await this.getHeaders()
      
      console.log(`🔍 GET ${endpoint}`)
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ GET ${endpoint} - Status: ${response.status}`, errorText)
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ GET ${endpoint} - Success`)
      return data
    } catch (error: any) {
      console.error(`❌ Error en GET ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const headers = await this.getHeaders()
      
      console.log(`📤 POST ${endpoint}`)
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ POST ${endpoint} - Status: ${response.status}`, errorText)
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ POST ${endpoint} - Success`)
      return result
    } catch (error: any) {
      console.error(`❌ Error en POST ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const headers = await this.getHeaders()
      
      console.log(`📝 PUT ${endpoint}`)
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ PUT ${endpoint} - Status: ${response.status}`, errorText)
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ PUT ${endpoint} - Success`)
      return result
    } catch (error: any) {
      console.error(`❌ Error en PUT ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data: any): Promise<T> {
    try {
      const headers = await this.getHeaders()
      
      console.log(`🔧 PATCH ${endpoint}`)
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ PATCH ${endpoint} - Status: ${response.status}`, errorText)
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ PATCH ${endpoint} - Success`)
      return result
    } catch (error: any) {
      console.error(`❌ Error en PATCH ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    try {
      const headers = await this.getHeaders()
      
      console.log(`🗑️ DELETE ${endpoint}`)
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ DELETE ${endpoint} - Status: ${response.status}`, errorText)
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ DELETE ${endpoint} - Success`)
      return result
    } catch (error: any) {
      console.error(`❌ Error en DELETE ${endpoint}:`, error)
      throw error
    }
  }
}

export const httpService = new HttpService()