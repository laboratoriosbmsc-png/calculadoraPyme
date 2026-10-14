import { Ellipsis, Eye, LoaderCircle, Pencil, Share2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Modal from './Modal'
import { useSolicitudes } from '../hooks/useSolicitudes'
import { nombreReferenciaDuplicado } from '../services/nombreReferencia'

export function useSolicitudActions(onDeleted) {
  const [editTarget, setEditTarget] = useState(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [sharePdf, setSharePdf] = useState(null)
  const [sharingId, setSharingId] = useState(null)
  const [shareNotice, setShareNotice] = useState('')
  const { solicitudesPropias, deleteSolicitud, updateSolicitud } = useSolicitudes()

  useEffect(() => {
    if (!shareNotice) return undefined
    const timeout = window.setTimeout(() => setShareNotice(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [shareNotice])

  const shareReport = async (item) => {
    if (sharingId) return
    setShareNotice('')
    const cachedFile = sharePdf?.itemId === item.id && sharePdf.updatedAt === item.fechaActualizacion ? sharePdf.file : null
    if (!cachedFile) setSharingId(item.id)
    try {
      let file = cachedFile
      if (!file) {
        const { createInformePdf } = await import('../services/informePdf')
        const { blob, fileName } = await createInformePdf(item)
        file = new File([blob], fileName, { type: 'application/pdf' })
      }
      setSharingId(null)
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        try {
          await navigator.share({ files: [file], title: `Informe de ${item.nombreReferencia}` })
          setSharePdf(null)
        } catch (error) {
          if (error.name === 'AbortError') {
            setSharePdf(null)
          } else if (error.name === 'NotAllowedError' && !cachedFile) {
            setSharePdf({ itemId: item.id, updatedAt: item.fechaActualizacion, file })
            setShareNotice('El PDF está listo. Pulsa Compartir informe otra vez.')
          } else {
            throw error
          }
        }
      } else {
        const url = URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        setSharePdf(null)
        setShareNotice('Tu navegador no permite compartir archivos; se descargó el PDF.')
      }
    } catch (error) {
      setSharePdf(null)
      if (error.name !== 'AbortError') setShareNotice('No se pudo compartir el PDF. Inténtalo de nuevo.')
    } finally {
      setSharingId(null)
    }
  }

  const openEdit = (item) => {
    setEditTarget(item)
    setEditName(item.nombreReferencia)
    setEditError('')
  }

  const saveName = (event) => {
    event.preventDefault()
    const clean = editName.trim()
    if (!clean) return setEditError('El nombre es obligatorio.')
    if (clean.length > 50) return setEditError('El nombre no puede superar los 50 caracteres.')
    if (!/^[\p{L}\p{N} .,'&()-]+$/u.test(clean)) return setEditError('Usa únicamente letras, números y signos comunes.')
    if (nombreReferenciaDuplicado(solicitudesPropias, clean, editTarget.id)) return setEditError('Ya existe una solicitud con ese nombre. Usa otro nombre.')
    if (updateSolicitud(editTarget.id, { nombreReferencia: clean })) setEditTarget(null)
  }

  const remove = () => {
    if (deleteSolicitud(deleteTarget.id)) {
      setDeleteTarget(null)
      onDeleted?.()
    }
  }

  return {
    editTarget, editName, editError, deleteTarget, sharingId, shareNotice,
    setEditTarget, setEditName, setEditError, setDeleteTarget,
    openEdit, saveName, remove, shareReport,
  }
}

export function SolicitudActionDialogs({ actions }) {
  return <>
    {actions.sharingId && <div className="share-report-loading" role="status" aria-label="Preparando el PDF para compartir" aria-live="polite"><LoaderCircle size={48} aria-hidden="true" /></div>}
    {actions.shareNotice && <div className="share-report-notice" role="status">{actions.shareNotice}</div>}
    <Modal open={Boolean(actions.editTarget)} onClose={() => actions.setEditTarget(null)} title="Editar nombre de referencia" description="Este nombre identifica la solicitud en toda la aplicación.">
      <form onSubmit={actions.saveName}><label className="field-label" htmlFor="editNombre">Nombre de referencia</label><input id="editNombre" className={`text-input ${actions.editError ? 'invalid' : ''}`} value={actions.editName} onChange={(event) => { actions.setEditName(event.target.value); actions.setEditError('') }} maxLength="50" autoFocus />{actions.editError && <p className="field-error">{actions.editError}</p>}<div className="field-meta"><small>Cliente o empresa · máximo 50 caracteres</small><small>{actions.editName.length}/50</small></div><div className="modal-actions"><button type="button" className="button secondary" onClick={() => actions.setEditTarget(null)}>Cancelar</button><button className="button primary">Guardar cambios</button></div></form>
    </Modal>
    <Modal open={Boolean(actions.deleteTarget)} onClose={() => actions.setDeleteTarget(null)} title="Eliminar solicitud" description="Esta acción es permanente y no puede deshacerse.">
      <div className="delete-message"><span className="danger-icon"><Trash2 /></span><p>¿Estás seguro de que deseas eliminar la solicitud de <strong>{actions.deleteTarget?.nombreReferencia}</strong> y toda la información de sus secciones?</p></div>
      <div className="modal-actions"><button type="button" className="button secondary" onClick={() => actions.setDeleteTarget(null)}>Cancelar</button><button type="button" className="button danger-button" onClick={actions.remove}>Eliminar definitivamente</button></div>
    </Modal>
  </>
}

export function SolicitudActionsMenu({ solicitud, onView, onShare, onEdit, onDelete, sharingId }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = (event) => {
      if (!triggerRef.current?.contains(event.target) && !popoverRef.current?.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const closeFloatingMenu = () => setOpen(false)
    document.addEventListener('click', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', closeFloatingMenu)
    window.addEventListener('scroll', closeFloatingMenu, true)
    return () => {
      document.removeEventListener('click', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', closeFloatingMenu)
      window.removeEventListener('scroll', closeFloatingMenu, true)
    }
  }, [open])

  const toggle = (event) => {
    if (open) return setOpen(false)
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 190
    const menuHeight = window.matchMedia('(max-width: 900px)').matches ? 186 : 144
    const gap = 6
    const openUp = window.innerHeight - rect.bottom < menuHeight + gap
    setPosition({
      top: openUp ? Math.max(8, rect.top - menuHeight - gap) : rect.bottom + gap,
      left: Math.min(window.innerWidth - menuWidth - 8, Math.max(8, rect.right - menuWidth)),
    })
    setOpen(true)
  }

  const select = (action) => {
    setOpen(false)
    action()
  }

  return <div className="card-menu-container request-actions-menu">
    <button ref={triggerRef} type="button" className="icon-button card-menu-trigger" onClick={toggle} aria-label={`Opciones de ${solicitud.nombreReferencia}`} aria-expanded={open} aria-haspopup="menu"><Ellipsis size={20} /></button>
    {open && position && createPortal(<div ref={popoverRef} className="card-menu-popover request-actions-popover" role="menu" style={position}>
      <button type="button" role="menuitem" onClick={() => select(onView)}><Eye size={17} />Ver informe</button>
      <button type="button" role="menuitem" className="share-report-option" disabled={Boolean(sharingId)} onClick={() => select(onShare)}><Share2 size={17} />Compartir informe</button>
      <button type="button" role="menuitem" onClick={() => select(onEdit)}><Pencil size={17} />Editar nombre</button>
      <button type="button" role="menuitem" className="danger" onClick={() => select(onDelete)}><Trash2 size={17} />Eliminar</button>
    </div>, document.body)}
  </div>
}
