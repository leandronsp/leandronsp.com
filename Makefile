.PHONY: help up down logs restart

help:
	@echo "leandronsp.com - Static Site Server"
	@echo "===================================="
	@echo ""
	@echo "Commands:"
	@echo "  make up       - Start nginx server (http://localhost:8000)"
	@echo "  make down     - Stop nginx server"
	@echo "  make logs     - View nginx logs"
	@echo "  make restart  - Restart nginx server"
	@echo ""

up:
	@echo "Starting nginx server..."
	@docker-compose up -d
	@echo "✓ Server running at http://localhost:8000"

down:
	@echo "Stopping nginx server..."
	@docker-compose down

logs:
	@docker-compose logs -f nginx

restart:
	@docker-compose restart nginx
	@echo "✓ Server restarted"
