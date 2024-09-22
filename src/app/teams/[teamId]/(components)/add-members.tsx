"use client"
import { Button } from '@/components/ui/button'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'
import toast from 'react-hot-toast'

function AddMembers({ joinId }: { joinId: string }) {
  return (
    <Button
      onClick={() => {
        navigator.clipboard.writeText(
          window.location.origin + "/teams/join/" + joinId,
        );
        toast.success("Invite link copied to clipboard");
      }}
    >
      Add Members
    </Button>
  );
}

export default AddMembers