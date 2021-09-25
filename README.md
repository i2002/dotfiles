# Installation
## Live CD Boot
- create partitions
- pacstrap base
- genfstab
- arch-chroot
- time and date
- configure root password
- locale
- microcode ([https://wiki.archlinux.org/title/Microcode])
- bootloader setup
- internet access (network manager)
- utilities (base-devel, vim, mc, git, wget): `pacman -S base-devel vim mc git wget`

## Setup
**Creare user**
- `useradd -m user`
- `passwd user` (atribuire parola)

**Administratori**
- `pacman -S sudo`
- `EDITOR=vim visudo` si decomentat `%wheel      ALL=(ALL) ALL`
- `usermod -aG wheel user` (make user admin)

**AUR helper**
- `git clone https://aur.archlinux.org/yay.git`
- `cd yay`
- `makepkg -si`

**Oprit beep terminal**
- in `/etc/inputrc` adaugat: `set bell-style none`
- in `/etc/vimrc` adaugat: `set belloff=all`

**Multilib**
- [https://wiki.archlinux.org/title/Official_repositories#multilib]

## Graphic drivers
**Install**
- [https://wiki.archlinux.org/title/xorg]
- [https://wiki.archlinux.org/title/AMDGPU]
- [https://wiki.archlinux.org/title/NVIDIA]

- `pacman -S xorg`
- `pacman -S nvidia nvidia-utils nvidia-settings nvidia-prime xf86-video-amdgpu mesa mesa-demos`
- `pacman -S lib32-mesa lib32-nvidia-utils`

**Enable early KMS**
- add `nvidia-drm.modeset=1` kernel parameter (edit `GRUB_CMDLINE_LINUX_DEFAULT` from `/etc/default/grub`)
- add `amdgpu nvidia_modeset nvidia_uvm nvidia_drm` to initramfs
- pacman hook to update initramfs on driver update (`/etc/pacman.d/hooks/nvidia.hook`):
```conf
[Trigger]
Operation=Install
Operation=Upgrade
Operation=Remove
Type=Package
Target=nvidia
Target=linux
# Change the linux part above and in the Exec line if a different kernel is used

[Action]
Description=Update Nvidia module in initcpio
Depends=mkinitcpio
When=PostTransaction
NeedsTargets
Exec=/bin/sh -c 'while read -r trg; do case $trg in linux) exit 0; esac; done; /usr/bin/mkinitcpio -P'
```


## GNOME
**Setup**
- `gnome` (without `gnome-software`, `vino`)
- `gnome-extras` (only `dconf-editor`, `gnome-sound-recorder`, `geary`, `polari`, `gnome-connections`)

**Login DM**
- `systemctl enable gdm.service`
- tap to click: `sudo -u gdm dbus-launch gsettings set org.gnome.desktop.peripherals.touchpad tap-to-click 'true'`

## Sway
**Setup**
- main: `pacman -S sway swayidle swaylock waybar alacritty`
- utilities: `pacman -S bemenu bemenu-wayland brightnessctl playerctl lxappearance pavucontrol`

**Configuration**
- sway: copy `./sway/config` to `~/.config/sway/config` (use bemenu, change window border, configure swayidle, enable tap to click, set keyboard layouts, add function keys, set waybar, window placement, start nm-applet)
- waybar: copy files in `.sway/waybar/` to `~/.config/waybar/` (configure theme and contents of the panel)
- start sway on login: edit `~/.bash_profile` and add contents from `./sway/bash_profile`

# Configuration
## Hybrid graphics
**Info**
- description [https://wiki.archlinux.org/title/hybrid_graphics]
- switchable graphics options: [https://wiki.archlinux.org/title/NVIDIA_Optimus]
- run some applications with NVIDIA: [https://wiki.archlinux.org/title/PRIME#PRIME_render_offload]
- NVIDIA driver documentation: [https://download.nvidia.com/XFree86/Linux-x86_64/470.63.01/README/]

- completely turn off NVIDIA card:
  - bbswitch
  - acpi_call
  - system76-power ([https://github.com/pop-os/system76-power])
  - asusctl ([https://gitlab.com/asus-linux/asusctl])

**Switch from GRUB**
- hybrid: `modprobe.blacklist=i2c_nvidia_gpu nvidia-drm.modeset=1 nvidia.NVreg_DynamicPowerManagement=0x02` kernel parameters (enable nvidia drm modeset)
- integrated: `modprobe.blacklist=i2c_nvidia_gpu modprobe.blacklist=nouveau modprobe.blacklist=nvidia modprobe.blacklist=nvidia_modeset modprobe.blacklist=nvidia_uvm modprobe.blacklist=nvidia_drm` kernel parameters (disable nvidia drivers)

**System76 Power**
- with `system76-power graphics power off` it can turn off the dGPU (noticeable difference in powertop)
- setup info below

**Optimus manager**
- supports newer functions (prime offloading, D3 power management) but also older methods: [https://github.com/Askannz/optimus-manager]
- configure offloading: [https://github.com/Askannz/optimus-manager/wiki/Nvidia-GPU-offloading-for-%22hybrid%22-mode]
- NVIDIA Runtime D3 power management: [https://github.com/Askannz/optimus-manager/wiki/A-guide--to-power-management-options]
- powering off the dGPU doesn't seem to work (even with `bbswitch-ati` package from AUR)

**NVIDIA power management (Runtime D3)**
- [https://us.download.nvidia.com/XFree86/Linux-x86_64/465.27/README/dynamicpowermanagement.html] - doesn't work on amd

## Power management
Make the laptop last longer on battery

**Overview**
- overview
  - [https://wiki.archlinux.org/title/Power_management],
  - [https://wiki.manjaro.org/index.php/Power_Management],
  - [https://austingwalters.com/increasing-battery-life-on-an-arch-linux-laptop-thinkpad-t14s/]
  - [https://support.system76.com/articles/battery]

- options
  - TLP (autoconfig) [https://wiki.archlinux.org/title/TLP]
  - Laptop mode tools (needs to be manually configured) [https://wiki.archlinux.org/title/Laptop_Mode_Tools]
  - System76-Power [https://github.com/pop-os/system76-power]
  - Powertop (power consumption analysis) [https://wiki.archlinux.org/title/Powertop]

- select graphic mode at boot
  - if the user knows which graphics mode wants to use from the time it boots the system (e.g. integrated when using the laptop on the go), it's inconvenient to boot the system, change the graphics mode and reboot
  - when changing with `system76-power graphics <mode>`, it adds a modprobe file with module options / blacklisting and modifies the contents of `/etc/prime-discrete` file and then regenerates initramfs and then asks for system reboot
  - module options and blacklist can be handeled with kernel parameters and some modifications to GRUB options
  - the `/etc/prime-discrete` file contains `off` for integrated graphics and `on-demand` for hybrid graphics; this can be achieved using a custom service which modifies the file based on a kernel parameter and configuring `system76-power.service` to run after the custom service

**Setup**
- tlp
  - `pacman -S tlp`
  - `yay -S tlpui`
  - `systemctl enable tlp.service`

- system76-power
  - `yay -S system76-power` (and `yay -S gnome-shell-extension-system76-power-git` for official GNOME extension)
  - `systemctl enable system76-power`
  - `usermod -aG admin <user>` (in order to be able to use the dBus interface)
  - `system76-power graphics integrated` (make the first graphics switch)
  - copy `./system76-power/prime-discrete.service` to `/etc/systemd/system/`
  - copy `./system76-power/set-prime-discrete.sh` to `/usr/local/bin`
  - enable service with `systemctl enable prime-discrete.service`
  - `systemctl edit system76-power.service` and copy contents from `./system76-power/system76-power-override.conf`
  - reload systemd: `systemctl daemon-reload` and reboot
  - update grub boot cmd line for graphics options and prime-discrete options (`prime-discrete="off"` for integrated and `prime-discrete="on-demand"` for hybrid)
  
## GRUB
**Setup**
- set and export `GRUB_CMDLINE_POWER_SAVING` and `GRUB_CMDLINE_POWER_NORMAL` in `/etc/default/grub` (see options from `./grub/grub`)
- add `GRUB_THEME="/usr/share/grub/themes/i2002-arch/theme.txt"` to `/etc/default/grub` (see `./grub/grub`)
- modify `/etc/grub.d/10_linux` to create a power saving menu entry and append `GRUB_CMDLINE_POWER_SAVING` and `GRUB_CMDLINE_POWER_NORMAL` options to kernel params (see `./grub/10_linux`)
- remove additional options: comment out other entries after main entry (see `./grub/10_linux`)
- add icon class for uefi settings: add `--class memtest` for (see `grub/30_uefi-firmware`)
- copy theme: `sudo mv ./grub/i2002-arch/ /usr/share/grub/themes/`
- generate grub config: `sudo grub-mkconfig -o /boot/grub/grub.cfg`

**Info**
- arch setup: [https://wiki.archlinux.org/title/GRUB]
- visual config: [https://wiki.archlinux.org/title/GRUB/Tips_and_tricks#Visual_configuration]
- theme documentation: [https://www.gnu.org/software/grub/manual/grub/grub.html#Theme-file-format]
- [https://github.com/WhyNotHugo/grub-holdshift]

**Theming**
- theme info
  - adapted from [https://github.com/xenlism/Grub-themes]
  - pure dark background
  - set the 48x48 icons from 2k theme option
  - add timeout progress bar (adapted from [https://github.com/fghibellini/arch-silence])
  - use Noto Sans font: `grub-mkfont /usr/share/fonts/noto/NotoSans-Regular.ttf -n "Noto Sans" -s 16 -o noto_sans_16.pf2` and place it in theme folder (`grub-mkconfig` required to apply changes)
- options
  - [https://github.com/sandesh236/sleek--themes]
  - [https://github.com/mateosss/matter]
  - [https://github.com/xenlism/Grub-themes]
  - [https://github.com/shvchk/poly-dark]
    
## Printer support
- install CUPS and HPLIP: `pacman -S cups cups-pdf hplip python-pyqt5`: [https://wiki.archlinux.org/title/CUPS]
- start cups service: `systemctl enable --now cups.service`
- setup printer: `hp-setup -u`
- binary driver (for scanning): `hp-plugin`
- default paper size:
  - add `a4` in `/etc/papersize` ([https://wiki.archlinux.org/title/CUPS#Default_paper_size])
  - add `LC_PAPER=en_DK.UTF-8` in `/etc/locale.conf`
  
## Localization
- calendar start week on monday: add `LC_TIME=en_DK.UTF-8` to `/etc/locale.conf`
    
## GNOME Keyring
Salvare parole si chei ssh

- documentation: [https://wiki.archlinux.org/title/GNOME/Keyring]
- installation: `pacman -S gnome-keyring seahorse`
- integration with git: `git config --global credential.helper /usr/lib/git-core/git-credential-libsecret`
- integration with gnupg: add `pinentry-program /usr/bin/pinentry-gnome3` to `~/.gnupg/gpg-agent.conf`

## Keyboard shortcuts
**GNOME**
- Switch applications: _Super+Tab_
- Switch windows: _Alt+Tab_
- Switch windows of an application: _Alt+`_

- Application volume mixer -  `gnome-control-center sound`: _Alt+Home_
- Enable extensions - `gsettings set org.gnome.shell disable-user-extensions false`: _Super+R_
- Terminal - `gnome-terminal`: _Ctrl+Alt+T_

**Sway**
- Lock screen and sleep: _Suepr+Shift+Enter_

## GNOME extensions
**Extensions web interface support**
- [https://wiki.gnome.org/Projects/GnomeShellIntegrationForChrome/Installation]
- `yay -S chrome-gnome-shell`

**Packets**
- `gnome-shell-extension-dash-to-panel`
- `gnome-shell-extension-arc-menu` (requires `xdg-utils` installed)
- `gnome-shell-extension-appindicator`
- `gnome-shell-extension-sound-output-device-chooser`
- `gnome-shell-extension-system-monitor-git`
- `gnome-shell-extension-gsconnect`

**Custom**
- system76 power: `cp ./gnome-extensions/graphics-power@i2002.com ~/.local/share/gnome-shell/extensions/`

**Install**
`yay -S gnome-shell-extension-dash-to-panel gnome-shell-extension-arc-menu xdg-utils gnome-shell-extension-appindicator gnome-shell-extension-system-monitor-git gnome-shell-extension-sound-output-device-chooser gnome-shell-extension-gsconnect`

**Configurations**
- `./gnome/arc-menu.config`
- `./gnome/dash-to-panel.config`

## Theming
**Icon theme**
- `papirus-icon-theme` (and set `Papirus Dark` as icon theme)

**GTK theme**
- `materia-gtk-theme`

**Fonts**
- `noto-fonts`, `noto-fonts-emoji`, `ttf-liberation`, `ttf-dejavu`, `adobe-source-code-pro-fonts`
- configure noto as default: copy `fonts.conf` to `~/.config/fontconfig/fonts.conf`, then run `fc-cache`
- GNOME font settings:
  - Interface Text: _Noto Sans Regular_, 11
  - Document Text: _Cantarell Regular_, 11
  - Monospace Text: _Source Code Pro Regular_, 10
  - Legacy Window Titles: _Cantarell Bold_, 11
  
**Boot splash screen**
- use _Plymouth_: `yay -S plymouth-git`
- setup
  - add `plymouth` to `HOOKS` in `/etc/mkinitcpio.conf` (after `base` and `udev`)
  - rebuild initramfs: `sudo mkinitcpio -p linux`
  - add `quiet splash loglevel=3 rd.systemd.show_status=auto rd.udev.log_level=3` kernel parameters (edit `GRUB_CMDLINE_LINUX_DEFAULT` from `/etc/default/grub`)
  - smooth transition: `yay -S gdm-plymouth` (or `yay -S gdm-plymouth-prime` for `optimus-manager`)
  - silent grub: `yay -S silent-grub` + reinstall grub to efi partition and rebuild `grub.cfg`
  
- themes
  - `hexagon`: `yay -S plymouth-theme-hexagon-git`
  - `blockchain`: `yay -S plymouth-theme-blockchain-git`
  - `darth_vader`: `yay -S plymouth-theme-darth-vader-git`
  - `arch-breeze`: `yay -S plymouth-theme-arch-breeze-git` (change icon `sudo ln -sf /usr/share/plymouth/themes/arch-breeze/logo_symb_grey_light.png /usr/share/plymouth/themes/arch-breeze/logo.png`)
  - `monoarch`: `yay -S plymouth-theme-monoarch`
  - `deus_ex`: `yay -S plymouth-theme-deus-ex-git`
  
- usage
  - change theme: `sudo plymouth-set-default-theme -R <theme-name>`
  - list themes: `plymouth-set-default-theme -l`

- info
  - [https://wiki.archlinux.org/title/plymouth]
  - [https://wiki.archlinux.org/title/Silent_boot]
  
**Code::Blocks**
- run `cb_share_config` and inport `./applications/codeblocks_color_themes.conf` into `~/.config/codeblocks/default.conf` (taken from [https://wiki.codeblocks.org/index.php/Syntax_highlighting_custom_colour_themes])
- alternatively replace the default config with `./applications/codeblocks_default.conf`

**Uniform styling for QT apps**
- `yay -S qgnomeplatform` ([https://wiki.archlinux.org/title/Uniform_look_for_Qt_and_GTK_applications#Styles_for_both_Qt_and_GTK])


# Applications
## Utilities
brasero, meld, keepassxc
wine-staging, winetricks

## Programming
visual-studio-code-bin, codeblocks-svn
gcc
jdk-openjdk, jre-openjdk, java-openjfx
nodejs, npm
docker, docker-compose, virtualbox, virtualbox-guest-iso, virtualbox-host-modules-arch

## Internet
firefox, google-chrome, discord

## Graphics
inkscape, gimp, blender, shotcut, obs-studio

## Sound
audacity

## Multimedia
spotify, vlc

## Gaming
steam, minecraft-launcher

----

# Extras
## Wayland
- [https://wiki.archlinux.org/title/wayland], [https://wiki.archlinux.org/title/PipeWire]
- instalat: `pacman -S wayland xorg-xwayland pipewire` (come with gnome package group)
- screenshare
    - [https://wiki.archlinux.org/title/PipeWire#WebRTC_screen_sharing]
    - `sudo pacman -S xdg-desktop-portal xdg-desktop-portal-gtk`
    - in chrome enable flag `chrome://flags/#enable-webrtc-pipewire-capturer`
    - in Discord it doesn't work: [https://support.discord.com/hc/en-us/community/posts/360047644231-Native-Wayland-Support?page=1]

## Use GNOME Software
- integrate with pacman: `pacman -S gnome-software-packagekit-plugin`
- disable automatic software donwload: `gsettings set org.gnome.software download-updates false` ([https://wiki.archlinux.org/title/GNOME/Tips_and_tricks#Prevent_GNOME_Software_from_downloading_updates])

## Configure LightDM
- tap to click: `/etc/X11/xorg.conf.d/40-libinput.conf`
```config
Section "InputClass"
        Identifier "libinput touchpad catchall"
        MatchIsTouchpad "on"
        MatchDevicePath "/dev/input/event*"
        Driver "libinput"
        Option "Tapping" "on"
EndSection
```

- `/etc/lightdm/lightdm.conf` uncomment
```config
sessions-directory=/usr/share/lightdm/sessions:/usr/share/xsessions:/usr/share/wayland-sessions
greeter-session=lightdm-gtk-greeter
```

- `/etc/lightdm/lightdm-gtk-greeter.conf`
```config
[greeter]
theme-name = Arc-Dark
icon-theme-name = Papirus
clock-format = %a %d %h, %H:%M
font-name = Sans 12
indicators = ~host;~spacer;~clock;~spacer;~session;~a11y;~power
```

- lock screen: `dm-tool lock`

## GDM Wayland and NVIDIA
- `sudo ln -s /dev/null /etc/udev/rules.d/61-gdm.rules`: [https://wiki.archlinux.org/title/GDM#Wayland_and_the_proprietary_NVIDIA_driver]
- `sudo mv /usr/share/xsessions/gnome.desktop /usr/share/xsessions/gnome.desktop.bak` (GNOME session option appears only once)

## Information
- gdm logs (wayland): `journalctl --user -b -u org.gnome.Shell@wayland.service`
- gdm logs (x11): `journalctl --user -b -u org.gnome.Shell@x11.service`
- nvidia runtime d3 status: `cat /proc/driver/nvidia/gpus/0000\:01\:00.0/power`
- nvidia gpu power status: `cat /sys/bus/pci/devices/0000:01:00.0/power/runtime_status`
- try to poweroff nvidia `acpi_call`: `sudo /usr/share/acpi_call/examples/turn_off_gpu.sh`
- gpu driver status: `glxinfo | grep "OpenGL renderer"`, `xrandr --listproviders`
