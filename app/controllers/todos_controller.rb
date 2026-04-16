class TodosController < ApplicationController
  before_action :set_todo, only: %i[ show edit update destroy toggle ]

  # GET /todos
  def index
    @todos = Todo.all
  end

  # GET /todos/1
  def show
  end

  # GET /todos/new
  def new
    @todo = Todo.new
  end

  # GET /todos/1/edit
  def edit
  end

  # POST /todos
  def create
    @todo = Todo.new(todo_params)

    if @todo.save
      redirect_to todos_path, notice: "Todo was successfully created."
    else
      render :new, status: :unprocessable_content
    end
  end

  # PATCH/PUT /todos/1
  def update
    if @todo.update(todo_params)
      respond_to do |format|
        format.html { redirect_to todos_path, notice: "Todo was successfully updated.", status: :see_other }
        format.json { head :ok }
      end
    else
      respond_to do |format|
        format.html { render :edit, status: :unprocessable_content }
        format.json { render json: @todo.errors, status: :unprocessable_content }
      end
    end
  end

  # PATCH /todos/1/toggle
  def toggle
    @todo.update!(completed: !@todo.completed)
    redirect_to todos_path, status: :see_other
  end

  # DELETE /todos/1
  def destroy
    @todo.destroy!
    redirect_to root_path, notice: "Todo was successfully destroyed.", status: :see_other
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_todo
      @todo = Todo.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def todo_params
      params.expect(todo: [ :title, :completed ])
    end
end
