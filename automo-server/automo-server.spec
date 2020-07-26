# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

from PyInstaller.utils.hooks import collect_data_files

extra_imports = ['tinycss2', 'cairocffi', 'pyphen', 'cssselect2']
module_data_files = []
for module in extra_imports:
    module_data_files += collect_data_files(module)

extra_imports.append('weasyprint')
weasyprint_files_src = collect_data_files('weasyprint')
weasyprint_files = []
counter = 0
for k,v in weasyprint_files_src:
    if counter == 0:
        weasyprint_files.append((k, '.'))
        counter += 1
    else:
        weasyprint_files.append((k, v.split('weasyprint/')[1]))
module_data_files.extend(weasyprint_files)




a = Analysis(['automo-server.py'],
             pathex=['/home/ali/Projects/automo-ria/automo-server'],
             binaries=[],
             datas=module_data_files,
             hiddenimports=extra_imports,
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher,
             noarchive=False)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          [],
          exclude_binaries=True,
          name='automo-server',
          debug=False,
          bootloader_ignore_signals=False,
          strip=False,
          upx=True,
          console=True )
coll = COLLECT(exe,
               a.binaries,
               a.zipfiles,
               a.datas,
               strip=False,
               upx=True,
               upx_exclude=[],
               name='automo-server')