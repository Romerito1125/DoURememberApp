import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PhotosListPage from '@/app/photos/page'

// Mock del router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('PhotosListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('Renderizado inicial', () => {
    it('debe renderizar el título y descripción', () => {
      render(<PhotosListPage />)

      expect(screen.getByText(/imágenes familiares/i)).toBeInTheDocument()
      expect(
        screen.getByText(/gestiona las fotografías del paciente/i)
      ).toBeInTheDocument()
    })

    it('debe mostrar el botón de Nueva Imagen', () => {
      render(<PhotosListPage />)

      const newButton = screen.getByRole('button', { name: /nueva imagen/i })
      expect(newButton).toBeInTheDocument()
    })

    it('debe renderizar Header y Footer', () => {
      render(<PhotosListPage />)

      // Verifica que los componentes estructurales estén presentes
      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
    })
  })

  describe('Estado vacío', () => {
    it('debe mostrar mensaje cuando no hay imágenes', () => {
      localStorage.setItem('patientPhotos', JSON.stringify([]))

      render(<PhotosListPage />)

      expect(screen.getByText(/no hay imágenes cargadas/i)).toBeInTheDocument()
      expect(
        screen.getByText(/comienza agregando fotografías familiares/i)
      ).toBeInTheDocument()
    })

    it('debe mostrar botón para cargar primera imagen en estado vacío', () => {
      localStorage.setItem('patientPhotos', JSON.stringify([]))

      render(<PhotosListPage />)

      const uploadButton = screen.getByRole('button', {
        name: /cargar primera imagen/i,
      })
      expect(uploadButton).toBeInTheDocument()
    })
  })

  describe('Listado de fotos', () => {
    const mockPhotos = [
      {
        id: '1',
        fileName: 'foto1.jpg',
        people: 'María López',
        location: 'Parque Central',
        context: 'Cumpleaños familiar',
        uploadDate: '2025-01-15T10:00:00.000Z',
        patientId: 'patient-123',
        imageData: 'data:image/jpeg;base64,fake',
      },
      {
        id: '2',
        fileName: 'foto2.jpg',
        people: 'Juan Pérez',
        location: 'Casa de la abuela',
        context: 'Navidad 2024',
        uploadDate: '2025-01-20T15:30:00.000Z',
        patientId: 'patient-123',
        imageData: 'data:image/jpeg;base64,fake2',
      },
    ]

    beforeEach(() => {
      localStorage.setItem('patientPhotos', JSON.stringify(mockPhotos))
    })

    it('debe mostrar todas las fotos cargadas', () => {
      render(<PhotosListPage />)

      expect(screen.getByText('foto1.jpg')).toBeInTheDocument()
      expect(screen.getByText('foto2.jpg')).toBeInTheDocument()
    })

    it('debe mostrar la información de cada foto', () => {
      render(<PhotosListPage />)

      expect(screen.getByText(/maría lópez/i)).toBeInTheDocument()
      expect(screen.getByText(/parque central/i)).toBeInTheDocument()
      expect(screen.getByText(/cumpleaños familiar/i)).toBeInTheDocument()
    })

    it('debe mostrar la fecha de carga formateada', () => {
      render(<PhotosListPage />)

      // Buscar elementos que contengan "Cargada:"
      const dateElements = screen.getAllByText(/cargada:/i)
      expect(dateElements.length).toBeGreaterThan(0)
    })

    it('debe tener botones de Editar y Eliminar para cada foto', () => {
      render(<PhotosListPage />)

      const editButtons = screen.getAllByRole('button', { name: /editar/i })
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i })

      expect(editButtons).toHaveLength(2)
      expect(deleteButtons).toHaveLength(2)
    })
  })

  describe('Navegación', () => {
    it('debe navegar a /photos/upload al hacer click en Nueva Imagen', () => {
      render(<PhotosListPage />)

      const newButton = screen.getByRole('button', { name: /nueva imagen/i })
      fireEvent.click(newButton)

      expect(mockPush).toHaveBeenCalledWith('/photos/upload')
    })

    it('debe navegar a edición al hacer click en Editar', () => {
      const mockPhotos = [
        {
          id: 'photo-123',
          fileName: 'test.jpg',
          people: 'Test',
          location: 'Test',
          context: 'Test',
          uploadDate: '2025-01-15T10:00:00.000Z',
          patientId: 'patient-123',
          imageData: 'data:image/jpeg;base64,fake',
        },
      ]
      localStorage.setItem('patientPhotos', JSON.stringify(mockPhotos))

      render(<PhotosListPage />)

      const editButton = screen.getByRole('button', { name: /editar/i })
      fireEvent.click(editButton)

      expect(mockPush).toHaveBeenCalledWith('/photos/edit/photo-123')
    })
  })

  describe('Modal de detalles', () => {
    const mockPhotos = [
      {
        id: '1',
        fileName: 'foto-detalle.jpg',
        people: 'Ana García',
        location: 'Playa',
        context: 'Vacaciones de verano',
        uploadDate: '2025-01-15T10:00:00.000Z',
        patientId: 'patient-123',
        imageData: 'data:image/jpeg;base64,fake',
      },
    ]

    beforeEach(() => {
      localStorage.setItem('patientPhotos', JSON.stringify(mockPhotos))
    })

    it('debe abrir modal al hacer click en una foto', () => {
      render(<PhotosListPage />)

      const photoCard = screen.getByText('foto-detalle.jpg').closest('div')
      if (photoCard) {
        fireEvent.click(photoCard)

        // El modal debería mostrar información completa
        expect(screen.getAllByText('foto-detalle.jpg')).toHaveLength(2) // Uno en tarjeta, otro en modal
        expect(screen.getByText(/personas en la foto/i)).toBeInTheDocument()
      }
    })

    it('debe cerrar modal al hacer click en el botón X', () => {
      render(<PhotosListPage />)

      // Abrir modal
      const photoCard = screen.getByText('foto-detalle.jpg').closest('div')
      if (photoCard) {
        fireEvent.click(photoCard)
      }

      // Cerrar modal
      const closeButtons = screen.getAllByRole('button')
      const xButton = closeButtons.find(btn => btn.querySelector('.lucide-x'))
      if (xButton) {
        fireEvent.click(xButton)

        // El modal no debería estar visible
        expect(screen.queryByText(/personas en la foto/i)).not.toBeInTheDocument()
      }
    })
  })

  describe('Eliminación de fotos', () => {
    const mockPhotos = [
      {
        id: 'delete-test',
        fileName: 'to-delete.jpg',
        people: 'Test User',
        location: 'Test Location',
        context: 'Test Context',
        uploadDate: '2025-01-15T10:00:00.000Z',
        patientId: 'patient-123',
        imageData: 'data:image/jpeg;base64,fake',
      },
    ]

    beforeEach(() => {
      localStorage.setItem('patientPhotos', JSON.stringify(mockPhotos))
    })

    it('debe abrir modal de confirmación al hacer click en Eliminar', () => {
      render(<PhotosListPage />)

      const deleteButton = screen.getByRole('button', { name: /eliminar/i })
      fireEvent.click(deleteButton)

      expect(screen.getByText(/confirmar eliminación/i)).toBeInTheDocument()
      expect(screen.getByText('to-delete.jpg')).toBeInTheDocument()
    })

    it('debe eliminar foto y mostrar mensaje de éxito', async () => {
      render(<PhotosListPage />)

      const deleteButton = screen.getByRole('button', { name: /eliminar/i })
      fireEvent.click(deleteButton)

      // Confirmar eliminación en el modal
      const confirmButton = screen.getByRole('button', { name: /eliminar/i })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(
          screen.getByText(/la imagen ha sido eliminada exitosamente/i)
        ).toBeInTheDocument()
      })

      // Verificar que ya no está en localStorage
      const photos = JSON.parse(localStorage.getItem('patientPhotos') || '[]')
      expect(photos).toHaveLength(0)
    })

    it('debe cerrar modal al cancelar eliminación', () => {
      render(<PhotosListPage />)

      const deleteButton = screen.getByRole('button', { name: /eliminar/i })
      fireEvent.click(deleteButton)

      expect(screen.getByText(/confirmar eliminación/i)).toBeInTheDocument()

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      fireEvent.click(cancelButton)

      expect(screen.queryByText(/confirmar eliminación/i)).not.toBeInTheDocument()
    })
  })

  describe('Persistencia de datos', () => {
    it('debe cargar fotos desde localStorage al montar', () => {
      const mockPhotos = [
        {
          id: '1',
          fileName: 'persistent.jpg',
          people: 'Test',
          location: 'Test',
          context: 'Test',
          uploadDate: '2025-01-15T10:00:00.000Z',
          patientId: 'patient-123',
          imageData: 'data:image/jpeg;base64,fake',
        },
      ]
      localStorage.setItem('patientPhotos', JSON.stringify(mockPhotos))

      render(<PhotosListPage />)

      expect(screen.getByText('persistent.jpg')).toBeInTheDocument()
    })
  })
})