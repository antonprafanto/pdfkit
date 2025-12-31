; NSIS Custom Installer Script for PDF Kit
; This script forces PDF file association during installation

!macro customInstall
  ; Register PDF Kit as a PDF handler
  
  ; Write application registration
  WriteRegStr HKCU "Software\Classes\PDF Kit.pdf" "" "PDF Document"
  WriteRegStr HKCU "Software\Classes\PDF Kit.pdf\DefaultIcon" "" "$INSTDIR\PDF Kit.exe,0"
  WriteRegStr HKCU "Software\Classes\PDF Kit.pdf\shell\open\command" "" '"$INSTDIR\PDF Kit.exe" "%1"'
  
  ; Associate .pdf extension with PDF Kit
  WriteRegStr HKCU "Software\Classes\.pdf" "" "PDF Kit.pdf"
  WriteRegStr HKCU "Software\Classes\.pdf" "Content Type" "application/pdf"
  WriteRegStr HKCU "Software\Classes\.pdf\OpenWithProgids" "PDF Kit.pdf" ""
  
  ; Set as default handler using UserChoice (Windows 8+)
  ; Note: Direct UserChoice modification may not work on Windows 10+ due to hash protection
  ; But we can set our app as a recommended handler
  
  ; Register in OpenWithList
  WriteRegStr HKCU "Software\Classes\.pdf\OpenWithList\PDF Kit.exe" "" ""
  
  ; Register capabilities for Windows
  WriteRegStr HKCU "Software\PDF Kit\Capabilities" "ApplicationDescription" "Modern PDF Toolkit - View, Edit, Merge, Split PDF files"
  WriteRegStr HKCU "Software\PDF Kit\Capabilities" "ApplicationName" "PDF Kit"
  WriteRegStr HKCU "Software\PDF Kit\Capabilities\FileAssociations" ".pdf" "PDF Kit.pdf"
  
  ; Register application in RegisteredApplications
  WriteRegStr HKCU "Software\RegisteredApplications" "PDF Kit" "Software\PDF Kit\Capabilities"
  
  ; Notify shell of changes
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
  
!macroend

!macro customUnInstall
  ; Clean up registry entries on uninstall
  
  ; Remove file type registration
  DeleteRegKey HKCU "Software\Classes\PDF Kit.pdf"
  DeleteRegValue HKCU "Software\Classes\.pdf\OpenWithProgids" "PDF Kit.pdf"
  DeleteRegValue HKCU "Software\Classes\.pdf\OpenWithList\PDF Kit.exe" ""
  
  ; Remove capabilities
  DeleteRegKey HKCU "Software\PDF Kit"
  DeleteRegValue HKCU "Software\RegisteredApplications" "PDF Kit"
  
  ; Notify shell of changes
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
  
!macroend
