import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DeletePhotoModal from '@/app/components/photos/DeletePhotoModal'

describe('DeletePhotoModal Component', () => {
  const mockOnConfirm = jest.fn()
  const mockOnCancel = jest.fn()
  const defaultProps = {
    isOpen: true,
    photoId: 'test-photo-id',
    photoName: 'foto-familiar.jpg',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Renderizado', () => {
    it('no debe renderizar nada cuando isOpen es false', () => {
      const { container } = render(
        <DeletePhotoModal {...defaultProps} isOpen={false} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('debe renderizar el modal cuando isOpen es true', () => {
      render(<DeletePhotoModal {...defaultProps} />)

      expect(screen.getByText(/confirmar eliminación/i)).toBeInTheDocument()
      expect(screen.getByText(/foto-familiar.jpg/i)).toBeInTheDocument()
      expect(screen.getByText(/esta acción no se puede deshacer/i)).toBeInTheDocument()
    })

    it('debe mostrar el icono de advertencia', () => {
      render(<DeletePhotoModal {...defaultProps} />)

      const warningIcon = screen.getByText(/confirmar eliminación/i)
        .closest('.flex')
        ?.querySelector('.text-red-600')

      expect(warningIcon).toBeInTheDocument()
    })

    it('debe mostrar ambos botones: Cancelar y Eliminar', () => {
      render(<DeletePhotoModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument()
    })
  })

  describe('Interacciones del usuario', () => {
    it('debe llamar onCancel cuando se hace click en Cancelar', () => {
      render(<DeletePhotoModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })

    it('debe llamar onCancel cuando se hace click en la X', () => {
      render(<DeletePhotoModal {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: '' }).closest('button')
      if (closeButton) {
        fireEvent.click(closeButton)
      }

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('debe llamar onConfirm con photoId cuando se hace click en Eliminar', async () => {
      mockOnConfirm.mockResolvedValue(undefined)
      render(<DeletePhotoModal {...defaultProps} />)

      const deleteButton = screen.getByRole('button', { name: /eliminar/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('test-photo-id')
      })
    })
  })

  describe('Estados de carga', () => {
    it('debe mostrar estado de carga mientras se elimina', async () => {
      mockOnConfirm.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<DeletePhotoModal {...defaultProps} />)

      const deleteButton = screen.getByRole('button', { name: /eliminar/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/eliminando/i)).toBeInTheDocument()
      })
    })

    it('debe deshabilitar botones mientras se elimina', async () => {
      mockOnConfirm.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<DeletePhotoModal {...defaultProps} />)

      const deleteButton = screen.getByRole('button', { name: /eliminar/i })
      const cancelButton = screen.getByRole('button', { name: /cancelar/i })

      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(deleteButton).toBeDisabled()
        expect(cancelButton).toBeDisabled()
      })
    })
  })

  describe('Manejo de errores', () => {
    it('debe mostrar mensaje de error si la eliminación falla', async () => {
      const errorMessage = 'Error al eliminar la imagen'
      mockOnConfirm.mockRejectedValue(new Error(errorMessage))

      render(<DeletePhotoModal {...defaultProps} />)

      const deleteButton = screen.getByRole('button', { name: /eliminar/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      // Los botones deben habilitarse nuevamente
      expect(deleteButton).not.toBeDisabled()
    })

    it('debe mostrar mensaje genérico si el error no es tipo Error', async () => {
      mockOnConfirm.mockRejectedValue('Error desconocido')

      render(<DeletePhotoModal {...defaultProps} />)

      const deleteButton = screen.getByRole('button', { name: /eliminar/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(
          screen.getByText(/error al eliminar la imagen. por favor intenta nuevamente/i)
        ).toBeInTheDocument()
      })
    })

    it('debe limpiar el error al cancelar', async () => {
      mockOnConfirm.mockRejectedValue(new Error('Error de prueba'))

      render(<DeletePhotoModal {...defaultProps} />)

      const deleteButton = screen.getByRole('button', { name: /eliminar/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/error de prueba/i)).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Prevención de acciones durante eliminación', () => {
    it('no debe permitir cancelar mientras se está eliminando', async () => {
      mockOnConfirm.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<DeletePhotoModal {...defaultProps} />)

      const deleteButton = screen.getByRole('button', { name: /eliminar/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/eliminando/i)).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      fireEvent.click(cancelButton)

      // onCancel no debería llamarse porque está deshabilitado
      expect(mockOnCancel).not.toHaveBeenCalled()
    })
  })
})