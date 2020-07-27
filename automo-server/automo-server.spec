# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

from PyInstaller.utils.hooks import collect_data_files

def collect_module_data_files(modules):
    result = []
    for module in modules:
        result.extend(collect_data_files(module))
    return result

def collect_weasyprint_files():
    weasyprint_files_src = collect_data_files('weasyprint')
    first_file, remaining_files = weasyprint_files_src[0], weasyprint_files_src[1:]
    return [(first_file[0], '.')] + [(k, v.split('weasyprint/')[1]) for k, v in remaining_files]

extra_imports = ['weasyprint']
extra_imports_with_files = ['tinycss2', 'cairocffi', 'pyphen', 'cssselect2']
data_files = [
    ('app/templates', 'app/templates/'),
    ('app/static', 'app/static/')

]

datas = data_files + collect_module_data_files(extra_imports_with_files)
datas += collect_weasyprint_files()


a = Analysis(['automo-server.py'],
             pathex=['automo-server'],
             binaries=[],
             datas=datas,
             hiddenimports=extra_imports + extra_imports_with_files,
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
