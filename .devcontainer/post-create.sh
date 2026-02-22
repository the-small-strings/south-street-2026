set -e

npm install -g typescript



pip install uv
echo 'eval "$(uv generate-shell-completion bash)"' >> ~/.bashrc

uv tool install poethepoet
poe _bash_completion | sudo tee /etc/bash_completion.d/poe.bash-completion
