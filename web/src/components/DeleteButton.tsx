'use client'

import { Button } from '@/components/ui/button'

export function DeleteButton() {
  return (
    <Button 
      variant="destructive" 
      size="sm" 
      type="submit" 
      onClick={(e) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce lien ? Cette action est irréversible.")) {
          e.preventDefault()
        }
      }}
    >
      Supprimer
    </Button>
  )
}
