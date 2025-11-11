import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PhotoForm from '@/app/components/photos/PhotoForm'

describe('PhotoForm Component', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Renderizado inicial', () => {
    it('debe renderizar todos los campos del formulario', () => {
      render(<PhotoForm onSubmit={mockOnSubmit} />)

      expect(screen.getByLabelText(/personas en la imagen/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/lugar/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contexto del evento/i)).toBeInTheDocument()
      expect(screen.getByText(/click para seleccionar imagen/i)).toBeInTheDocument()
    })

    it('debe mostrar campos vacíos en modo crear', () => {
      render(<PhotoForm onSubmit={mockOnSubmit} />)

      const peopleInput = screen.getByPlaceholderText(/maría lópez/i)
      const locationInput = screen.getByPlaceholderText(/parque central/i)
      const contextInput = screen.getByPlaceholderText(/cumpleaños/i)

      expect(peopleInput).toHaveValue('')
      expect(locationInput).toHaveValue('')
      expect(contextInput).toHaveValue('')
    })

    it('debe mostrar datos iniciales en modo editar', () => {
      const initialData = {
        people: 'Juan Pérez',
        location: 'Casa',
        context: 'Reunión familiar',
      }

      render(
        <PhotoForm 
          onSubmit={mockOnSubmit} 
          initialData={initialData}
          isEditMode={true}
        />
      )

      expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Casa')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Reunión familiar')).toBeInTheDocument()
    })
  })

  describe('Validación de formulario', () => {
    it('debe mostrar error si no se selecciona imagen en modo crear', async () => {
      render(<PhotoForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: /guardar/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/debes seleccionar una imagen/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('debe mostrar error si falta el campo personas', async () => {
      render(<PhotoForm onSubmit={mockOnSubmit} isEditMode={true} />)

      const locationInput = screen.getByPlaceholderText(/parque central/i)
      const contextInput = screen.getByPlaceholderText(/cumpleaños/i)

      await userEvent.type(locationInput, 'Parque')
      await userEvent.type(contextInput, 'Evento especial')

      const submitButton = screen.getByRole('button', { name: /guardar/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/personas.*es obligatorio/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('debe mostrar error si falta el campo lugar', async () => {
      render(<PhotoForm onSubmit={mockOnSubmit} isEditMode={true} />)

      const peopleInput = screen.getByPlaceholderText(/maría lópez/i)
      const contextInput = screen.getByPlaceholderText(/cumpleaños/i)

      await userEvent.type(peopleInput, 'María')
      await userEvent.type(contextInput, 'Evento especial')

      const submitButton = screen.getByRole('button', { name: /guardar/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/lugar.*es obligatorio/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar error si falta el contexto', async () => {
      render(<PhotoForm onSubmit={mockOnSubmit} isEditMode={true} />)

      const peopleInput = screen.getByPlaceholderText(/maría lópez/i)
      const locationInput = screen.getByPlaceholderText(/parque central/i)

      await userEvent.type(peopleInput, 'María')
      await userEvent.type(locationInput, 'Parque')

      const submitButton = screen.getByRole('button', { name: /guardar/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/contexto.*es obligatorio/i)).toBeInTheDocument()
      })
    })
  })

  describe('Validación de archivo', () => {
    it('debe rechazar archivos que no sean JPG o PNG', async () => {
      render(<PhotoForm onSubmit={mockOnSubmit} />)

      const file = new File(['contenido'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/imagen/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        await userEvent.upload(input, file)

        await waitFor(() => {
          expect(screen.getByText(/formato no válido/i)).toBeInTheDocument()
        })
      }
    })

    it('debe rechazar archivos mayores a 10MB', async () => {
      render(<PhotoForm onSubmit={mockOnSubmit} />)

      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })
      const input = screen.getByLabelText(/imagen/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 })
        await userEvent.upload(input, largeFile)

        await waitFor(() => {
          expect(screen.getByText(/supera el tamaño máximo/i)).toBeInTheDocument()
        })
      }
    })
  })

  describe('Envío del formulario', () => {
    it('debe enviar datos correctamente en modo editar', async () => {
      const initialData = {
        people: 'Juan',
        location: 'Casa',
        context: 'Fiesta',
      }

      render(
        <PhotoForm 
          onSubmit={mockOnSubmit}
          initialData={initialData}
          isEditMode={true}
        />
      )

      const submitButton = screen.getByRole('button', { name: /actualizar/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            people: 'Juan',
            location: 'Casa',
            context: 'Fiesta',
          })
        )
      })
    })

    it('debe llamar onCancel cuando se presiona cancelar', () => {
      render(<PhotoForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Estados de carga', () => {
    it('debe mostrar estado de carga al enviar', async () => {
      render(<PhotoForm onSubmit={mockOnSubmit} isEditMode={true} />)

      const peopleInput = screen.getByPlaceholderText(/maría lópez/i)
      const locationInput = screen.getByPlaceholderText(/parque central/i)
      const contextInput = screen.getByPlaceholderText(/cumpleaños/i)

      await userEvent.type(peopleInput, 'María')
      await userEvent.type(locationInput, 'Parque')
      await userEvent.type(contextInput, 'Evento')

      const submitButton = screen.getByRole('button', { name: /guardar/i })
      fireEvent.click(submitButton)

      // En el momento del click, debería cambiar el texto
      await waitFor(() => {
        expect(screen.getByText(/guardando/i)).toBeInTheDocument()
      })
    })
  })
})